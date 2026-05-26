export default {

  // Triple-double-quoted:  """multi-line string"""
  // Triple-single-quoted:  '''another multi-line'''
  bq_triple_quoted_string: _ => token(
    choice(
      seq('"""', /([^"]|"[^"]|""[^"])*/, '"""'),
      seq("'''", /([^']|'[^']|''[^'])*/, "'''"),
    ),
  ),

};
