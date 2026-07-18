
import {Kv} from "@e280/kv"
import {bytes, collect} from "@e280/stz"
import {science, test, expect} from "@e280/science"

import {Mammoth} from "./core/mammoth.js"
import {randomId} from "./core/utils/random-id.js"
import {MemoryBucket} from "./core/memory-bucket.js"

const blob = () => new Blob([new Uint8Array([0xDE, 0xAD, 0xBE, 0xEF])])
const quickstream = (b: number[]) => new Blob([new Uint8Array(b)]).stream()

function setup() {
	const manifest = new Kv()
	const bucket = new MemoryBucket()
	const mammoth = new Mammoth(manifest, bucket)
	return {mammoth}
}

await science.run({
	"mammoth": {
		".write and .read": test(async() => {
			const {mammoth} = setup()
			const hash = await mammoth.write(blob().stream())
			const second = await mammoth.read(hash)
			expect(bytes.eq(await second.bytes(), await blob().bytes()))
		}),

		".write deduplication": test(async() => {
			const {mammoth} = setup()
			const hashA = await mammoth.write(blob().stream())
			const hashB = await mammoth.write(blob().stream())
			const keys = await collect(mammoth.keys())
			expect(hashA).is(hashB)
			expect(keys.length).is(1)
			expect(keys[0]).is(hashA)
		}),

		".write empty file": test(async() => {
			const {mammoth} = setup()
			const hash = await mammoth.write(new Blob().stream())
			expect(await mammoth.size(hash)).is(0)
			expect((await mammoth.read(hash)).size).is(0)
		}),

		".write distinct files": test(async() => {
			const {mammoth} = setup()
			const hashA = await mammoth.write(quickstream([0xC0, 0xFF, 0xEE]))
			const hashB = await mammoth.write(quickstream([0xB0, 0x0B, 0x1E, 0x5]))
			expect(hashA).not.is(hashB)
			expect((await collect(mammoth.keys())).length).is(2)
		}),

		".stats": test(async() => {
			const {mammoth} = setup()
			expect(await mammoth.stats()).deep({size: 0})
			const hashA = await mammoth.write(quickstream([0xC0, 0xFF, 0xEE]))
			expect(await mammoth.stats()).deep({size: 3})
			const hashB = await mammoth.write(quickstream([0xB0, 0x0B, 0x1E, 0x5]))
			expect(await mammoth.stats()).deep({size: 7})
			await mammoth.delete(hashA)
			expect(await mammoth.stats()).deep({size: 4})
			await mammoth.delete(hashB)
			expect(await mammoth.stats()).deep({size: 0})
		}),

		".has": test(async() => {
			const {mammoth} = setup()
			const hash = await mammoth.write(blob().stream())
			expect(await mammoth.has(hash)).is(true)
			expect(await mammoth.has(randomId())).is(false)
		}),

		".size": test(async() => {
			const {mammoth} = setup()
			const hash = await mammoth.write(blob().stream())
			expect(await mammoth.size(hash)).is(4)
		}),

		".delete": test(async() => {
			const {mammoth} = setup()
			const hash = await mammoth.write(blob().stream())
			await mammoth.delete(hash)
			expect(await mammoth.has(hash)).is(false)
			expect(await collect(mammoth.keys())).deep([])
		}),

		".delete idempotent": test(async() => {
			const {mammoth} = setup()
			await mammoth.delete(randomId())
		}),

		".keys": test(async() => {
			const {mammoth} = setup()
			const hash = await mammoth.write(blob().stream())
			const keys = await collect(mammoth.keys())
			expect(keys.length).is(1)
			expect(keys[0]).is(hash)
		}),
	},
})

