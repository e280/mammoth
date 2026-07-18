
import {Kv} from "@e280/kv"
import {got, hex} from "@e280/stz"
import {blake3} from "@noble/hashes/blake3.js"

import {randomId} from "./utils/random-id.js"
import {Glacier, Hash, Iceberg, Id} from "./types.js"

export class Mammoth implements Glacier {
	#index
	#iceberg

	constructor(index: Kv<string>, iceberg: Iceberg) {
		this.#index = index
		this.#iceberg = iceberg
	}

	async has(hash: Hash) {
		return this.#index.has(hash)
	}

	async size(hash: Hash) {
		const id = await this.#needFileId(hash)
		return this.#iceberg.size(id)
	}

	async read(hash: Hash) {
		const id = await this.#needFileId(hash)
		return this.#iceberg.read(id)
	}

	async delete(hash: Hash) {
		const id = await this.#getFileId(hash)
		if (id) {
			await this.#index.del(hash)
			await this.#iceberg.delete(id)
		}
	}

	async write(readable: ReadableStream<Uint8Array>): Promise<Hash> {
		const id = randomId()
		const pipe = new TransformStream()
		const done = this.#iceberg.write(id, pipe.readable)
		const writer = pipe.writable.getWriter()
		const hasher = blake3.create()

		for await (const chunk of readable) {
			await writer.write(chunk as Uint8Array<ArrayBuffer>)
			hasher.update(chunk)
		}

		await writer.close()
		await done
		const hash = hex.fromBytes(hasher.digest())
		await this.delete(hash)
		await this.#index.set(hash, id)
		return hash
	}

	async #getFileId(hash: Hash): Promise<Id | undefined> {
		return this.#index.get<string>(hash)
	}

	async #needFileId(hash: Hash): Promise<Id> {
		return got(await this.#getFileId(hash), `file not found by hash "${hash}"`)
	}

	async* keys() {
		yield* this.#index.keys()
	}
}

