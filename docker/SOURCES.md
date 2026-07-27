# Historical CPython sources

`tools/fetch_cpython.sh` downloads these archives directly from Python.org.

The legacy build image uses the Debian Squeeze base archive together with its archived security updates. The latter supplies development packages compatible with the `libc6` version already present in the Squeeze image.

| Runtime | Archive | Integrity check |
|---|---|---|
| CPython 1.6 | `https://www.python.org/ftp/python/src/Python-1.6.tar.gz` | MD5 `9d72ef93d7698769d9d3be7c17d5ad92`; historical FreeBSD ports distinfo; expected size 4,114,315 bytes |
| CPython 2.7.18 | `https://www.python.org/ftp/python/2.7.18/Python-2.7.18.tar.xz` | SHA-256 `b62c0e7937551d0cc02b8fd5cb0f544f9405bafc9a54d3808ed4594812edef43` |

The Python 1.6 archive predates modern release signing. It is fetched over HTTPS and checked against the checksum recorded by historical FreeBSD packaging metadata. The script also prints the downloaded archive’s SHA-256 into the workflow log.

Python 1.6 is subject to its CNRI license agreement, included inside the downloaded source distribution. The archive is used only to construct the test runtime and is not committed to this repository.
