
import {Kv} from "@e280/kv"
import {collect, got} from "@e280/stz"
import {consts} from "../consts.js"
import {notFound} from "./not-found.js"
import {isExpired} from "./is-expired.js"
import {Hash, Id, Info, Stats, Wip} from "../types.js"

export class Manifest {

	/** associates file hashes with bucket ids */
	#info

	/** temporary record of writes in-progress */
	#wip

	/** statistics about the whole datalake */
	#stats

	constructor(kv = new Kv()) {
		this.#info = kv.scope<Info>("info")
		this.#wip = kv.scope<Wip>("wip")
		this.#stats = kv.store<Stats>("stats")
	}

	async* hashes() {
		yield* this.#info.keys()
	}

	async hasHash(hash: Hash) {
		return this.#info.has(hash)
	}

	async saveInfo(hash: Hash, info: Info) {
		await this.#info.set(hash, info)
	}

	async getInfo(hash: Hash) {
		return await this.#info.get(hash)
	}

	async needInfo(hash: Hash) {
		return got(await this.getInfo(hash), notFound(hash))
	}

	async deleteInfo(hash: Hash) {
		await this.#info.del(hash)
	}

	async addWip(id: Id) {
		await this.#wip.set(id, {created: Date.now()})
	}

	async deleteWip(...ids: Id[]) {
		await this.#wip.del(...ids)
	}

	async statsAddFile(size: number) {
		await this.#updateStats(stats => {
			stats.count += 1
			stats.size += size
		})
	}

	async statsRemoveFile(size: number) {
		await this.#updateStats(stats => {
			stats.count -= 1
			stats.size -= size
		})
	}

	async getExpiredIds() {
		const limit = consts.self_clean_limit
		return (await collect(this.#wip.entries({limit})))
			.filter(([,wip]) => isExpired(wip))
			.map(([id]) => id)
	}

	async getStats() {
		return structuredClone((await this.#stats.get()) ?? {count: 0, size: 0})
	}

	async #updateStats(fn: (stats: Stats) => void) {
		const stats = await this.getStats()
		fn(stats)
		await this.#stats.set(stats)
	}
}

