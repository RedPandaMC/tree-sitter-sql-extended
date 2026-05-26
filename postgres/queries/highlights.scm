; inherits: sql

; Postgres-specific index type keywords
[
  (keyword_btree)
  (keyword_gist)
  (keyword_spgist)
  (keyword_gin)
  (keyword_brin)
] @function.call

; PostgreSQL replication / CTE / DO keywords (#31)
[
  (keyword_publication)
  (keyword_subscription)
  (keyword_search)
  (keyword_breadth)
  (keyword_depth)
] @keyword
