# tracer

## Overview

**トレーサビリティ** 確認のための UI 付きサンプル

（API などを使って）製品データを入力する。その際にロット番号（lotno）と、この製品を作る際に使った製品のロット番号（prev_lotnos）を含めてデータを作成する。また入力者のユーザーID（user_id）も含める。

ユーザーIDで製品を検索し、その結果からその製品を作るために使った製品を逆引きできる。逆引きはデータがある限り何段階でも遡れる。

サンプルUI（/）では **１つの製品を作るために使う製品が１つである** という前提の上で逆引きを視覚化する。


## OpenAPI Document

http://localhost:8080/doc/ 参照



## Copyright

2020 [K.Kimura @ Juge.Me](https://github.com/dotnsf) all rights reserved.
