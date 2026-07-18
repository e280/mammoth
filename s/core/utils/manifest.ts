
import {Kv} from "@e280/kv"
import {collect, got} from "@e280/stz"
import {consts} from "../consts.js"
import {notFound} from "./not-found.js"
import {isExpired} from "./is-expired.js"
import {Hash, Id, Stats, Wip} from "../types.js"

export class Manifest {

	/** associates file hashes with bucket ids */
	#ids

	/** temporary record of writes in-progress */
	#wip

	/** statistics about the whole datalake */
	#stats

	constructor(kv = new Kv()) {
		this.#ids = kv.scope<string>("ids")
		this.#wip = kv.scope<Wip>("wip")
		this.#stats = kv.store<Stats>("stats")
	}

	async* hashes() {
		yield* this.#ids.keys()
	}

	async hasHash(hash: Hash) {
		return this.#ids.has(hash)
	}

	async associate(hash: Hash, id: Id) {
		await this.#ids.set(hash, id)
	}

	async getId(hash: Hash) {
		return await this.#ids.get(hash)
	}

	async needId(hash: Hash) {
		return got(await this.getId(hash), notFound(hash))
	}

	async deleteId(hash: Hash) {
		await this.#ids.del(hash)
	}

	async addWip(id: Id) {
		await this.#wip.set(id, {created: Date.now()})
	}

	async deleteWip(...ids: Id[]) {
		await this.#wip.del(...ids)
	}

	async addFileStats(size: number) {
		await this.#updateStats(stats => {
			stats.count += 1
			stats.size += size
		})
	}

	async removeFileStats(size: number) {
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

