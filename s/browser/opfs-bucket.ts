
import {Bucket, Id} from "../core/types.js"
import {isNotFound} from "./utils/is-not-found.js"

export class OpfsBucket implements Bucket {
	#directory

	constructor(directory: FileSystemDirectoryHandle) {
		this.#directory = directory
	}

	async has(id: Id) {
		try {
			await this.#directory.getFileHandle(id)
			return true
		}
		catch (error) {
			if (isNotFound(error)) return false
			throw error
		}
	}

	async size(id: Id) {
		const handle = await this.#directory.getFileHandle(id)
		const file = await handle.getFile()
		return file.size
	}

	async delete(id: Id) {
		try {
			await this.#directory.removeEntry(id)
		}
		catch (error) {
			if (!isNotFound(error))
				throw error
		}
	}

	async read(id: Id) {
		const handle = await this.#directory.getFileHandle(id)
		return handle.getFile()
	}

	async write(id: Id, readable: ReadableStream<Uint8Array>) {
		const handle = await this.#directory.getFileHandle(id, {create: true})
		const writable = await handle.createWritable()
		await readable.pipeTo(writable)
	}
}

