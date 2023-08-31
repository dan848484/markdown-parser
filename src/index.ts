import { generate } from "./generator";
import { parse } from "./parser";
const convertToHTMLString = (markdown: string) => {
  const mdArray = markdown.split(/\r\n|\r|\n/); //行ごとに区切る
  const asts = mdArray.map((md) => parse(md));
  console.log(asts);

  const htmlString = generate(asts);
  return htmlString;
};

console.log(convertToHTMLString("* list1\n* list2"));
