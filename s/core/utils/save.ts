
import {hex} from "@e280/stz"
import {blake3} from "@noble/hashes/blake3.js"
import {Analysis, Bucket, Id} from "../types.js"

export async function save(
		bucket: Bucket,
		id: Id,
		readable: ReadableStream<Uint8Array>,
	): Promise<Analysis> {

	let size = 0
	const hasher = blake3.create()

	await bucket.write(id, readable.pipeThrough(
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

