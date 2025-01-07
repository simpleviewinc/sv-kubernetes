//@ts-check
const crypto = require("crypto");
const streamp = require("stream/promises");
const fs = require("fs");

const user = "Simpleview-ORG";
const box = "sv-kubernetes";
const version = process.argv[2];

if (version === undefined) {
	throw new Error("Must specify a version, node create_version.js x.y.z");
}

const token = process.env.HASHICORP_TOKEN;
const provider = process.arch === "x64" ? "virtualbox" : "vmware_desktop";
const arch = process.arch === "x64" ? "amd64" : "arm64";
const boxPath = `${__dirname}/../output-sv-kubernetes/package.box`;

const headers = {
	Authorization: `Bearer ${token}`,
	"Content-Type": "application/json"
}

/**
 *
 * @param {object} args
 * @param {string} args.method
 * @param {string} args.path
 * @param {object} [args.body]
 * @returns {Promise<any>}
 */
async function postToVagrant({
	method,
	path,
	body
}) {
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
	console.log("Check if the box exists");
	const exists = await postToVagrant({
		method: "GET",
		path: `/api/v2/box/${user}/${box}/version/${version}/provider/${provider}/${arch}`
	});

	if (!exists.errors) {
		console.log("Box already exists.");
		return;
	}

	const hasher = crypto.createHash("sha512");
	const readBox = fs.createReadStream(boxPath);
	await streamp.pipeline(readBox, hasher);
	const result = hasher.digest("hex");

	console.log("Adding version...");
	await postToVagrant({
		method: "POST",
		path: `/api/v2/box/${user}/${box}/versions`,
		body: {
			version: {
				version
			}
		}
	});

	console.log("Adding provider...");
	await postToVagrant({
		method: "POST",
		path: `/api/v2/box/${user}/${box}/version/${version}/providers`,
		body: {
			provider: {
				checksum: result,
				checksum_type: "sha512",
				name: provider,
				architecture: arch
			}
		}
	});

	console.log("Getting upload_path to post the box to...");
	const downloadResult = await postToVagrant({
		method: "GET",
		path: `/api/v2/box/${user}/${box}/version/${version}/provider/${provider}/${arch}/upload`
	});

	const stats = fs.statSync(boxPath);
	console.log("Uploading the file to Vagrant cloud, this may take a while...")
	const uploadResult = await fetch(downloadResult.upload_path, {
		method: "PUT",
		headers: {
			"Content-Length": stats.size.toString()
		},
		//@ts-expect-error - It doesn't like this, but it works so I'm not sure why a ReadableStream is valid in the interface
		body: fs.createReadStream(boxPath),
		duplex: "half"
	});

	console.log(await uploadResult.text());
}

run();
