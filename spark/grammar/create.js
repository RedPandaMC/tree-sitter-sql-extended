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
};
