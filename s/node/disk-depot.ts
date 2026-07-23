
import {join} from "node:path"
import {Readable} from "node:stream"
import {pipeline} from "node:stream/promises"
import {mkdir, stat, unlink} from "node:fs/promises"
import {createWriteStream, openAsBlob} from "node:fs"

import {Depot, Id} from "../core/types.js"
import {isNotFound} from "./utils/is-not-found.js"

export class DiskDepot implements Depot {
	#directory

	constructor(directory: string) {
		this.#directory = directory
	}

	async has(id: Id) {
		try {
			await stat(this.#path(id))
			return true
		}
		catch (error) {
			if (isNotFound(error)) return false
			throw error
		}
	}

	async delete(id: Id) {
		try {
			await unlink(this.#path(id))
		}
		catch (error) {
			if (!isNotFound(error))
				throw error
		}
	}

	async read(id: Id) {
		return openAsBlob(this.#path(id))
	}

	async write(id: Id, readable: ReadableStream<Uint8Array>) {
		await mkdir(this.#directory, {recursive: true})
		await pipeline(
			Readable.fromWeb(readable as any),
			createWriteStream(this.#path(id)),
		)
	}

	#path(id: Id) {
		return join(this.#directory, id)
	}
}

