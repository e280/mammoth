
export type Hash = string
export type RandomId = string

export type Glacier = {
	has(hash: Hash): Promise<boolean>
	size(hash: Hash): Promise<number>
	read(hash: Hash): Promise<Blob>
	write(readable: ReadableStream<Uint8Array>): Promise<Hash>
}

