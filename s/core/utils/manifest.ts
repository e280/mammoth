
import {Kv} from "@e280/kv"
import {got} from "@e280/stz"
import {notFound} from "./not-found.js"
import {isExpired} from "./is-expired.js"
import {Hash, Id, Info, Stats, Wip} from "../types.js"

export class Manifest {
	#kv

	/** statistics about the whole datalake */
	#stats

	/** associates file hashes with bucket ids */
	#info

	/** temporary record of writes in-progress */
	#wip

	/** statistics about the whole datalake */
	#trash

	constructor(kv = new Kv()) {
		this.#kv = kv
		this.#stats = kv.store<Stats>("stats")
		this.#info = kv.scope<Info>("info")
		this.#wip = kv.scope<Wip>("wip")
		this.#trash = kv.scope<true>("trash")
	}

	async getStats() {
		return structuredClone((await this.#stats.get()) ?? {count: 0, size: 0})
	}

	async* hashes() {
		yield* this.#info.keys()
	}

	async hasHash(hash: Hash) {
		return this.#info.has(hash)
	}

	async getInfo(hash: Hash) {
		return this.#info.get(hash)
	}

	async needInfo(hash: Hash) {
		return got(await this.getInfo(hash), notFound(hash))
	}

	async addWip(id: Id) {
		await this.#wip.set(id, {created: Date.now()})
	}

	async deleteWip(...ids: Id[]) {
		await this.#wip.del(...ids)
	}

	async* getExpiredWipIds() {
		for await (const [id, wip] of this.#wip.entries()) {
			if (isExpired(wip))
				yield id
		}
	}

	async moveWipToTrash(id: Id) {
		await this.#kv.transaction(() => [
			this.#wip.write.del(id),
			this.#trash.write.set(id, true),
		])
	}

	async dropTrashRecord(id: Id) {
		await this.#trash.del(id)
	}

	async* listTrashIds() {
		yield* this.#trash.keys()
	}

	async scheduleDeletion(hash: Hash, info: Info) {
		const stats = await this.getStats()
		stats.count -= 1
		stats.size -= info.size
		await this.#kv.transaction(() => [
			this.#info.write.del(hash),
			this.#trash.write.set(info.id, true),
			this.#stats.write.set(stats),
		])
	}

	async commit(hash: Hash, info: Info) {
		const isNewFile = !await this.hasHash(hash)

		if (isNewFile) {
			const stats = await this.getStats()
			stats.count += 1
			stats.size += info.size
			await this.#kv.transaction(() => [
				this.#wip.write.del(info.id),
				this.#info.write.set(hash, info),
				this.#stats.write.set(stats)
			])
		}
		else {
			await this.#kv.transaction(() => [
				this.#wip.write.del(info.id),
				this.#trash.write.set(info.id, true),
			])
		}
	}
}

