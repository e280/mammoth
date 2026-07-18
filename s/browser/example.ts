
import {Kv, StorageDriver} from "@e280/kv"
import {Mammoth} from "../core/mammoth.js"
import {IcebergOpfs} from "./iceberg-opfs.js"

export async function example() {

	// setup the localstorage kv index
	const driver = new StorageDriver(window.localStorage)
	const kv = new Kv(driver)
	const index = kv.scope("glacier_index")

	// setup the opfs iceberg
	const root = await navigator.storage.getDirectory()
	const directory = await root.getDirectoryHandle("glacier", {create: true})
	const iceberg = new IcebergOpfs(directory)

	// setup the mammoth
	const mammoth = new Mammoth(index, iceberg)
	const bigFile = new Blob([new Uint8Array([0xDE, 0xAD, 0xBE, 0xEF])])

	// write a file as an example
	const hash = await mammoth.write(bigFile.stream())
	console.log(`mammoth stored file by hash "${hash}"`)
}

