
import {Kv, StorageMagazine} from "@e280/kv"
import {Mammoth} from "../core/mammoth.js"
import {OpfsBucket} from "./opfs-bucket.js"

export async function example() {

	// setup the localstorage kv
	const driver = new StorageMagazine()
	const kv = new Kv(driver).scope("mammoth")

	// setup the opfs file bucket
	const root = await navigator.storage.getDirectory()
	const directory = await root.getDirectoryHandle("mammoth", {create: true})
	const bucket = new OpfsBucket(directory)

	// setup the mammoth
	const mammoth = new Mammoth(bucket, kv)
	const myFile = new Blob([new Uint8Array([0xDE, 0xAD, 0xBE, 0xEF])])

	// write a file as an example
	const hash = await mammoth.write(myFile.stream())
	console.log(`mammoth stored file "${hash}"`)
}

