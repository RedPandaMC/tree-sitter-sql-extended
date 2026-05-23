import { paren_list } from "../../grammar/helpers.js";

export default {
  _table_settings: $ => choice(
    $.table_partition,
    $.stored_as,
    $.storage_location,
    $.table_sort,
    $.table_cluster,
    $.row_format,
    seq($.keyword_tblproperties, paren_list($.table_option, true)),
    seq($.keyword_without, $.keyword_oids),
    $.storage_parameters,
    // Databricks SHALLOW CLONE / DEEP CLONE
    $.shallow_clone,
    $.table_option,
  ),

  shallow_clone: $ => seq(
    choice($.keyword_shallow, $.keyword_deep),
    $.keyword_clone,
    $.object_reference,
  ),

  // CLUSTERED BY (col [, ...]) [SORTED BY (col [, ...])] INTO n BUCKETS
  table_cluster: $ => seq(
    $.keyword_clustered, $.keyword_by, paren_list($.field, true),
    optional(seq($.keyword_sorted, $.keyword_by, paren_list($.field, true))),
    $.keyword_into, $.literal, $.keyword_buckets,
  ),

  stored_as: $ => seq(
    $.keyword_stored, $.keyword_as,
    choice(
      $.keyword_parquet, $.keyword_csv, $.keyword_sequencefile,
      $.keyword_textfile, $.keyword_rcfile, $.keyword_orc,
      $.keyword_avro, $.keyword_jsonfile,
    ),
  ),

  storage_location: $ => prec.right(
    seq(
      $.keyword_location,
      field('path', alias($._literal_string, $.literal)),
      optional(seq(
        $.keyword_cached, $.keyword_in,
        field('pool', alias($._literal_string, $.literal)),
        optional(choice(
          $.keyword_uncached,
          seq($.keyword_with, $.keyword_replication, '=',
              field('value', alias($._natural_number, $.literal))),
        )),
      ))
    ),
  ),

  row_format: $ => seq(
    $.keyword_row, $.keyword_format, $.keyword_delimited,
    optional(seq(
      $.keyword_fields, $.keyword_terminated, $.keyword_by,
      field('fields_terminated_char', alias($._literal_string, $.literal)),
      optional(seq(
        $.keyword_escaped, $.keyword_by,
        field('escaped_char', alias($._literal_string, $.literal)),
      )),
    )),
    optional(seq(
      $.keyword_lines, $.keyword_terminated, $.keyword_by,
      field('row_terminated_char', alias($._literal_string, $.literal)),
    ))
  ),

  table_sort: $ => seq(
    $.keyword_sort, $.keyword_by, paren_list($.identifier, true),
  ),

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
    )
  ),
};
