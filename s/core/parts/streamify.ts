
export function streamify(bytes: Uint8Array, chunkSize = 64 * 1024) {
	let offset = 0

	return new ReadableStream<Uint8Array>({
		pull(controller) {
			if (offset >= bytes.length) {
				controller.close()
				return
			}

			const end = Math.min(offset + chunkSize, bytes.length)
			controller.enqueue(bytes.subarray(offset, end))
			offset = end
		},
	})
}

