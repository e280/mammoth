
import {Kv} from "@e280/kv"
import {got, hex} from "@e280/stz"
import {blake3} from "@noble/hashes/blake3.js"
import {randomId} from "../core/utils/random-id.js"
import {Glacier, Hash, RandomId} from "../core/types.js"

export class BrowserGlacier implements Glacier {
	#index
	#directory

	constructor(index: Kv<string>, directory: FileSystemDirectoryHandle) {
		this.#index = index
		this.#directory = directory
	}

	async has(hash: Hash) {
		return this.#index.has(hash)
	}

	async size(hash: Hash) {
		const id = await this.#needFileId(hash)
		const handle = await this.#directory.getFileHandle(id)
		const file = await handle.getFile()
		return file.size
	}

	async read(hash: Hash) {
		const id = await this.#needFileId(hash)
		const handle = await this.#directory.getFileHandle(id)
		return handle.getFile()
	}

	async delete(hash: Hash) {
		const id = await this.#getFileId(hash)
		if (id) {
			await this.#index.del(hash)
			await this.#directory.removeEntry(id)
		}
	}

	async write(readable: ReadableStream<Uint8Array>): Promise<Hash> {
		const id = randomId()
		const handle = await this.#directory.getFileHandle(id, {create: true})
		const writable = await handle.createWritable({keepExistingData: false})
		const hasher = blake3.create()

		for await (const chunk of readable) {
			await writable.write(chunk as Uint8Array<ArrayBuffer>)
			hasher.update(chunk)
		}

		await writable.close()
		const hash = hex.fromBytes(hasher.digest())
		await this.delete(hash)
		await this.#index.set(hash, id)
		return hash
	}

	async #getFileId(hash: Hash): Promise<RandomId | undefined> {
		return this.#index.get<string>(hash)
	}

	async #needFileId(hash: Hash): Promise<RandomId> {
		return got(await this.#getFileId(hash), `file not found by hash "${hash}"`)
	}

	async* keys() {
		yield* this.#index.keys()
	}
}

