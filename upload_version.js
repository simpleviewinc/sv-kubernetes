const crypto = require("crypto");
const streamp = require("stream/promises");
const fs = require("fs");

const user = "owenallenaz";
const box = "sv-kubernetes";
const version = process.argv[2];

if (version === undefined) {
	throw new Error("Must specify a version, node create_version.js x.y.z");
}

const token = process.env.HASHICORP_TOKEN;
const provider = process.arch === "x64" ? "virtualbox" : "qemu";
const arch = process.arch === "x64" ? "amd64" : "arm64";
const boxPath = `${__dirname}/output-sv-kubernetes/package.box`;

const headers = {
	Authorization: `Bearer ${token}`,
	"Content-Type": "application/json"
}

async function postToVagrant({ method, path, body }) {
	const result = await fetch(`https://app.vagrantup.com${path}`, {
		method,
		headers,
		body: body !== undefined ? JSON.stringify(body) : undefined
	});

	const json = await result.json();
	console.log(json);

	return json;
}

async function run() {
	const exists = postToVagrant({
		method: "GET",
		path: `/api/v2/box/${user}/${box}/version/${version}/provider/${provider}/${arch}`
	});

	if (exists.success !== false) {
		console.log("Box already exists.");
		return;
	}

	const hasher = crypto.createHash("sha512");
	const readBox = fs.createReadStream(boxPath);
	await streamp.pipeline(readBox, hasher);
	const result = hasher.digest("hex");

	await postToVagrant({
		method: "POST",
		path: `/api/v2/box/${user}/${box}/versions`,
		body: {
			version: {
				version
			}
		}
	});

	await postToVagrant({
		method: "POST",
		path: `/api/v2/box/${user}/${box}/version/${version}/providers`,
		body: {
			provider: {
				checksum: result,
				checksum_type: "sha512",
				name: provider,
				architecture: "amd64",
				default_architecture: true
			}
		}
	});

	const downloadResult = await postToVagrant({
		method: "GET",
		path: `/api/v2/box/${user}/${box}/version/${version}/provider/${provider}/${arch}/upload`
	});

	const stats = fs.statSync(boxPath);
	const uploadResult = await fetch(downloadResult.upload_path, {
		method: "PUT",
		headers: {
			"Content-Length": stats.size
		},
		body: fs.createReadStream(boxPath),
		duplex: "half"
	});

	console.log(await uploadResult.text());
}

run();
