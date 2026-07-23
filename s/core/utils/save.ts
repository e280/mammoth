
import {hex} from "@e280/stz"
import {blake3} from "@awasm/noble"
import {Analysis, Depot, Id} from "../types.js"

export async function save(
		depot: Depot,
		id: Id,
		readable: ReadableStream<Uint8Array>,
	): Promise<Analysis> {

	let size = 0
	const hasher = blake3.create()

	await depot.write(id, readable.pipeThrough(
		new TransformStream({
			transform(chunk, controller) {
				hasher.update(chunk)
				size += chunk.byteLength
				controller.enqueue(chunk)
			},
		})
	))

	const hash = hex.fromBytes(hasher.digest())
	return {hash, size}
}

