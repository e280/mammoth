
![](https://i.imgur.com/1TQmFwW.png)

# 🦣 mammoth
> *big files. small api.*

**mammoth is a file storage typescript library.** we use it in our web apps to store files like user uploads. it's content-addressed. files are streamed into a bucket, identified by their blake3 hash, and deduplicated. mammoth works the same whether it's backed by a bucket in memory, on disk, in the cloud, or in the browser's opfs. mammoth uses [kv](https://github.com/e280/kv) for bookkeeping.

```bash
npm install @e280/mammoth @e280/kv
```

```ts
import {Mammoth} from "@e280/mammoth"

const mammoth = new Mammoth()
```

## 🦣 mammoth stores files.
- **write a file,** and you get back its blake3 `hash` and `size` in bytes.
    ```ts
    const hash = await mammoth.write(blob.stream())
    ```
- **read a file,** identified by its hash.
    ```ts
    const blob = await mammoth.read(hash)
    ```
- **delete a file.**
    ```ts
    await mammoth.delete(hash)
    ```

## 🦣 mammoth is bucket-agnostic.
- **memory bucket,** for testing.
  ```ts
  import {Mammoth, MemoryBucket} from "@e280/mammoth"
  import {Kv} from "@e280/kv"

  const mammoth = new Mammoth(

    // bucket for blob storage
    new MemoryBucket(),

    // kv for metadata bookkeeping
    new Kv(),
  )
  ```
  defaults shown, this is equivalent:
  ```ts
  const mammoth = new Mammoth()
  ```
- **disk bucket,** for nodejs servers. *(note the import paths)*
  ```ts
  import {Mammoth} from "@e280/mammoth"
  import {DiskBucket} from "@e280/mammoth/node"
  import {Kv} from "@e280/kv"
  import {LevelDriver} from "@e280/kv/level"

  const mammoth = new Mammoth(
    new DiskBucket("./data/bucket"),
    new Kv(new LevelDriver("./data/kv")),
  )
  ```
- **opfs bucket,** for local storage in the browser. *(note the import paths)*
  ```ts
  import {Mammoth} from "@e280/mammoth"
  import {OpfsBucket} from "@e280/mammoth/browser"
  import {Kv, StorageDriver} from "@e280/kv"

  const mammoth = new Mammoth(
    new OpfsBucket(await navigator.storage.getDirectory()),
    new Kv(new StorageDriver(localStorage)),
  )
  ```

## 🦣 more mammoth methods.
- **check if a file exists,** get back a boolean.
    ```ts
    const exists = await mammoth.has(hash)
    ```
- **get file info,** including `size` in bytes, `added` timestamp, and bucket `id`.
    ```ts
    const {size, added, id} = await mammoth.info(hash)
    ```
- **get stats,** for the whole datalake.
    ```ts
    await mammoth.stats()
      // {count: 123, size: 123456789}
    ```
- **loop over every file,** with their hashes and infos.
    ```ts
    for await (const [hash, info] of mammoth.entries())
      console.log(hash, info)
    ```

## 🦣 mammoth-brained tips.
- **`analyze` is for hashing files.**
    ```ts
    import {analyze} from "@e280/mammoth"

    const {hash, size} = await analyze(blob.stream())
    ```
- **`analyze` can help you avoid unnecessary uploads.**
    ```ts
    const {hash} = await analyze(blob.stream())

    if (!await mammoth.has(hash))
      await mammoth.write(blob.stream())
    ```
- **`streamify` makes a stream for a Uint8Array.**
    ```ts
    import {streamify} from "@e280/mammoth"

    const readable = await streamify(new Uint8Array([0xDE, 0xAD, 0xBE, 0xEF]))
    ```



<br/><br/>

*https://e280.org/*

