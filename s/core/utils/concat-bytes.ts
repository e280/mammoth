
// TODO replace with stz bytes.concat when it's available
export function concatBytes(parts: Uint8Array[]) {
	let size = 0
	for (const part of parts) size += part.byteLength

	const bytes = new Uint8Array(size)

	let offset = 0
	for (const part of parts) {
		bytes.set(part, offset)
		offset += part.byteLength
	}

	return bytes as Uint8Array
}

