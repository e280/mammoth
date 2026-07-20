
import {Bucket, Id} from "../types.js"
import {isNotFoundErr} from "../utils/is-not-found.js"

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
			if (isNotFoundErr(error)) return false
			throw error
		}
	}

	async delete(id: Id) {
		try {
			await this.#directory.removeEntry(id)
		}
		catch (error) {
			if (!isNotFoundErr(error))
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

