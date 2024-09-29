# claytoncoin

## Prerequisites
```bash
sudo apt update -y && sudo apt install nodejs -y
```

## Installation
```bash
git clone https://github.com/officialputuid/claytoncoin && cd claytoncoin && npm i
```

## Configuration
- Add `query_id=xxxx` or `user_id=xxxx` to `data.txt`.
- Set proxies in `proxy.txt`: `http://user:pass@ip:port`.

## Usage
| | |
|--------------------------|-------------------------------------------|
| `node clayton`           | Start claytoncoin.                        |
| `node clayton-mt-proxy`  | Start with multi-thread & proxy support.  |
