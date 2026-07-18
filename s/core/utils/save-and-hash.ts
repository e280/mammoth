
import {hex} from "@e280/stz"
import {blake3} from "@noble/hashes/blake3.js"
import {Bucket, Id} from "../types.js"

export async function saveAndHash(bucket: Bucket, id: Id, readable: ReadableStream<Uint8Array>) {
	let size = 0
	const pipe = new TransformStream()
	const done = bucket.write(id, pipe.readable)
	const writer = pipe.writable.getWriter()
	const hasher = blake3.create()

	for await (const chunk of readable) {
		await writer.write(chunk as Uint8Array<ArrayBuffer>)
		hasher.update(chunk)
		size += chunk.byteLength
	}

	await writer.close()
	await done

	const hash = hex.fromBytes(hasher.digest())
	return {hash, size}
}

