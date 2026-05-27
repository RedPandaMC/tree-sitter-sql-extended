import { paren_list } from '../helpers.js';

// Shared HiveQL-compatible storage rules used by both Spark SQL and Hive SQL.
// These rules form the table storage surface that Spark SQL inherited from
// HiveQL when it was designed as a Hive-compatible query engine.

export default {

  // STORED AS file_format
  stored_as: $ => seq(
    $.keyword_stored,
    $.keyword_as,
    choice(
      $.keyword_parquet,
      $.keyword_csv,
      $.keyword_sequencefile,
      $.keyword_textfile,
      $.keyword_rcfile,
      $.keyword_orc,
      $.keyword_avro,
      $.keyword_jsonfile,
    ),
  ),

  // LOCATION 'path' [CACHED IN 'pool' [WITH REPLICATION = n] | UNCACHED]
  storage_location: $ => prec.right(
    seq(
      $.keyword_location,
      field('path', alias($._literal_string, $.literal)),
      optional(seq(
        $.keyword_cached,
        $.keyword_in,
        field('pool', alias($._literal_string, $.literal)),
        optional(choice(
          $.keyword_uncached,
          seq(
            $.keyword_with,
            $.keyword_replication,
            '=',
            field('value', alias($._natural_number, $.literal)),
          ),
        )),
      )),
    ),
  ),

  // ROW FORMAT DELIMITED [FIELDS TERMINATED BY 'x' [ESCAPED BY 'e']]
  //                      [LINES TERMINATED BY 'y']
  row_format: $ => seq(
    $.keyword_row,
    $.keyword_format,
    $.keyword_delimited,
    optional(seq(
      $.keyword_fields,
      $.keyword_terminated,
      $.keyword_by,
      field('fields_terminated_char', alias($._literal_string, $.literal)),
      optional(seq(
        $.keyword_escaped,
        $.keyword_by,
        field('escaped_char', alias($._literal_string, $.literal)),
      )),
    )),
    optional(seq(
      $.keyword_lines,
      $.keyword_terminated,
      $.keyword_by,
      field('row_terminated_char', alias($._literal_string, $.literal)),
    )),
  ),

  // CLUSTERED BY (cols) [SORTED BY (cols)] INTO n BUCKETS
  table_cluster: $ => seq(
    $.keyword_clustered,
    $.keyword_by,
    paren_list($.field, true),
    optional(seq($.keyword_sorted, $.keyword_by, paren_list($.field, true))),
    $.keyword_into,
    $.literal,
    $.keyword_buckets,
  ),

  // SORT BY (cols)
  table_sort: $ => seq(
    $.keyword_sort,
    $.keyword_by,
    paren_list($.identifier, true),
  ),

  // PARTITION BY / PARTITIONED BY
  table_partition: $ => seq(
    choice(
      seq($.keyword_partition, $.keyword_by, choice($.keyword_range, $.keyword_hash)),
      seq($.keyword_partitioned, $.keyword_by),
      $.keyword_partition,
    ),
    choice(
      paren_list($.identifier),
      $.column_definitions,
      paren_list($._key_value_pair, true),
    ),
  ),

};
