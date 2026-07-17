
import {Kv, StorageDriver} from "@e280/kv"
import {BrowserGlacier} from "./browser-glacier.js"

export async function example() {
	const driver = new StorageDriver(window.localStorage)
	const kv = new Kv(driver)
	const index = kv.scope("glacier_index")

	const root = await navigator.storage.getDirectory()
	const directory = await root.getDirectoryHandle("glacier", {create: true})

	const glacier = new BrowserGlacier(index, directory)
	const bigFile = new Blob([new Uint8Array([0xDE, 0xAD, 0xBE, 0xEF])])

	const hash = await glacier.write(bigFile.stream())

	console.log(`glacier stored file by hash "${hash}"`)
}

