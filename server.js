import "dotenv/config";
import express from "express";
import { loginValidateSchema } from "./validation/login.validation.js";
import { registerValidateSchema } from "./validation/register.validation.js";
import { User } from "./model/user.model.js";
import { hashPass, verifyPass } from "./util/hash.util.js";
import { dbconnection } from "./db/mongoDB.js";
import { genJWT } from "./jwt/jwt.js";
import { postgresPool, connectPostgreSQL } from "./db/pg.js";
import { validateLocation } from "./validation/location.validation.js";
import { validateTier } from "./validation/tier.validation.js";
const app = express();
app.use(express.json());
app.use(express.urlencoded());

app.post("/auth/register", async (req, res) => {
	try {
		const validateRegister = registerValidateSchema.validate(req.body);
		const { value, error } = validateRegister;
		if (error) {
			return res.status(429).json({
				success: false,
				message: error.details[0].message,
			});
		}
		const { fullname, email, distCode, password } = value;
		const isEmailExists = await User.findOne({ email: email });
		if (isEmailExists) {
			return res.status(409).json({
				success: false,
				message: "Email already exists!",
			});
		}
		const insertData = await User.insertOne({
			fullname: fullname,
			email: email,
			distCode: distCode,
			password: await hashPass(password),
		});

		if (!insertData) {
			return res.status(400).json({
				success: false,
				message: "Data insertion failed!",
			});
		}
		return res.status(200).json({
			success: true,
			message: {
				fullname: fullname,
				distCode: distCode,
				email: email,
			},
		});
	} catch (err) {
		console.log(err);
		res.status(500).json({
			success: false,
			message: "Something went wrong!",
		});
	}
});

app.post("/auth/login", async (req, res) => {
	try {
		const validateData = loginValidateSchema.validate(req.body);
		const { value, error } = validateData;
		if (error) {
			return res.status(429).json({
				success: false,
				message: error.details[0].message,
			});
		}
		const { distCode, email, password } = value;
		const isEmailExists = await User.findOne({ email: email });
		if (!isEmailExists) {
			return res.status(400).json({
				success: false,
				message: "Invalid Credentials!",
			});
		}
		if (distCode != isEmailExists.distCode) {
			return res.status(400).json({
				success: false,
				message: "Invalid Credentials!",
			});
		}
		if (!(await verifyPass(password, isEmailExists.password))) {
			return res.status(400).json({
				success: false,
				message: "Invalid Credentials!",
			});
		}
		res.cookie("token", genJWT(distCode, email), {
			expires: new Date(Date.now() + 2 * 60 * 60 * 1000),
			secure: true,
			httpOnly: true,
		});
		return res.status(200).json({
			success: true,
			message: "Login Successfull!",
		});
	} catch (err) {
		console.log(err);
		return res.status(500).json({
			success: false,
			message: "Something went wrong",
		});
	}
});

app.get("/api/zone/redzones", async (req, res) => {
	try {
		const result = await postgresPool.query(`SELECT json_build_object(
          'type', 'FeatureCollection',
          'features', json_agg(
            json_build_object(
              'type', 'Feature',
              'geometry', ST_AsGeoJSON(wkb_geometry)::json,
              'properties', json_build_object(
                'zone_class', zone_class,
                'area_sqkm', area_sqkm
              )
            )
          )
        ) AS geojson
        FROM red_zones;`);
		return res.status(200).json(result.rows[0].geojson);
	} catch (err) {
		console.log(err);
		return res.status(500).json({
			message: "Something went wrong!",
		});
	}
});

app.get("/api/zone/check-location", (req, res) => {
	try {
		const validateData = validateLocation.validate(req.query);
		const { error, value } = validateData;
		if (error) {
			return res.status(429).json({
				success: false,
				message: "Invalid Coordinates!",
			});
		}
		const { lat, lon } = value;
		const result = postgresPool.query(
			`
      SELECT zone_class, area_sqkm
      FROM red_zones
      WHERE ST_Contains(wkb_geometry, ST_SetSRID(ST_MakePoint($1, $2), 4326))
      LIMIT 1;
    `,
			[lon, lat],
		);
		if (result.rows.length === 0) {
			return res.status(404).json({
				message:
					"No zone data found for this location (outside district boundary or gap in coverage).",
				location: { lat: parseFloat(lat), lon: parseFloat(lon) },
			});
		}
		const zoneLabels = { 0: "GREEN", 1: "YELLOW", 2: "RED" };
		const zone = result.rows[0];
		return res.status(200).json({
			location: { lat: parseFloat(lat), lon: parseFloat(lon) },
			zone_class: zoneLabels[zone.zone_class],
			zone_area_sqkm: zone.area_sqkm,
		});
	} catch (err) {
		console.log(err);
		return res.status(500).json({
			message: "Something went wrong!",
		});
	}
});

app.get("/api/zone/nearest-green-zone", (req, res) => {
	try {
		const validateData = validateLocation.validate(req.query);
		const { error, value } = validateData;
		if (error) {
			return res.status(429).json({
				success: false,
				message: "Invalid Coordinates!",
			});
		}
		const { lat, lon } = value;
		const result = postgresPool.query(
			`
      SELECT
        zone_class,
        area_sqkm,
        ST_Distance(
          wkb_geometry::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) / 1000.0 AS distance_km,
        ST_AsGeoJSON(ST_ClosestPoint(wkb_geometry, ST_SetSRID(ST_MakePoint($1, $2), 4326)))::json AS nearest_point
      FROM red_zones
      WHERE zone_class = 0
      ORDER BY wkb_geometry <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)
      LIMIT 1;
    `,
			[lon, lat],
		);
		if (result.rows.length === 0) {
			return res.status(404).json({
				message: "No green zone found for this location.",
			});
		}
		const site = result.rows[0];
		return res.status(200).json({
			from_location: { lat: parseFloat(lat), lon: parseFloat(lon) },
			nearest_safe_zone: {
				zone_area_sqkm: site.area_sqkm,
				distance_km: parseFloat(site.distance_km.toFixed(2)),
				nearest_point: site.nearest_point,
			},
		});
	} catch (err) {
		console.log(err);
		return res.status(500).json({
			message: "Something went wrong!",
		});
	}
});

app.get("/api/zone/priority-villages", (req, res) => {
	try {
		const validateData = validateTier.validate(req.query);
		const { error, value } = validateData;
		if (error) {
			return res.status(429).json({
				success: false,
				message:
					"tier must be one of ['IMMEDIATE', 'SHORT_TERM', 'MEDIUM_TERM', 'MONITOR']",
			});
		}
		const { tier } = value;
		const result = postgresPool.query(
			`
          SELECT vill_name AS village_name, sub_dist AS sub_district,
          population, pct_red, estimated_affected_population, priority_tier
          FROM villages
          WHERE priority_tier = $1
          ORDER BY estimated_affected_population DESC;
      `,
			tier.toUpperCase(),
		);
		res.status(200).json({
			count: result.rows.length,
			total_estimated_affected_population: result.rows.reduce(
				(sum, r) => sum + r.estimated_affected_population,
				0,
			),
			villages: result.rows,
		});
	} catch (err) {
		console.log(err);
		return res.status(500).json({
			message: "Something went wrong!",
		});
	}
});

const dbConnect = async () => {
	try {
		console.log(process.env.DB_USER);
		await dbconnection();
		console.log("MongoDB connected!");
		await connectPostgreSQL();
		console.log("PostgresDB Connected!");
		app.listen(8000, "0.0.0.0", () => {
			console.log("Server Started...");
		});
	} catch (err) {
		console.log(err);
	}
};
dbConnect();
