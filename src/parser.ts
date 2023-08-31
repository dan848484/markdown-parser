import {
  genStrongElement,
  genTextElement,
  matchWithListRegxp,
  matchWithStrongRegxp,
} from "./lexer";
import { Token } from "./models/token";

const rootToken: Token = {
  id: 0,
  elmType: "root",
  content: "",
  parent: {} as Token,
};

export const parse = (markdownRow: string) => {
  if (matchWithListRegxp(markdownRow)) {
    return _tokenizeList(markdownRow);
  }
  return _tokennizeText(markdownRow);
};

const _tokennizeText = (
  textElement: string,
  initialId: number = 0,
  initialRoot: Token = rootToken
) => {
  let elements: Token[] = [];
  let parent: Token = initialRoot;

  let id = initialId;
  const _tokenize = (originalText: string, p: Token) => {
    let processingText = originalText;
    //processingTextを前方から少しずつ処理していって空文字列になるまで実行。
    parent = p;
    while (processingText.length !== 0) {
      const matchArray = matchWithStrongRegxp(
        processingText
      ) as RegExpMatchArray;
      if (!matchArray) {
        //対象の行においてマッチしない場合は
        id += 1;
        const onlyText = genTextElement(id, processingText, parent);
        processingText = "";
        elements.push(onlyText);
      } else {
        //aaa**bb**cc　みたいなパターンの読み取り
        if (Number(matchArray.index) > 0) {
          //indexがマッチした位置を表すので、0より大きければその前に何かがあるということがわかる。
          const text = processingText.substring(0, Number(matchArray.index));
          id += 1;
          const textElm = genTextElement(id, text, parent);
          elements.push(textElm);
          processingText = processingText.replace(text, "");
        }

        id += 1;
        const elm = genStrongElement(id, "", parent);
        parent = elm;
        elements.push(elm);
        processingText = processingText.replace(matchArray[0], "");
        /**
         * indexが1以降の要素にはキャプチャグループのマッチした値（正規表現で括弧を使って表現されてる部分）が格納される。
         * なのでこの場合は**here** hereの部分が取り出されてるイメージ
         */
        _tokenize(matchArray[1], parent); //再帰でさらに。再帰的下向き構文解析
        parent = p; //parentをpに戻す。
      }
    }
  };
  _tokenize(textElement, parent);
  return elements;
};

export const _tokenizeList = (listString: string) => {
  const UL = "ul";
  const LIST = "li";

  let id = 1;
  const rootUlToken: Token = {
    id,
    elmType: UL,
    content: "",
    parent: rootToken,
  };
  let parent = rootUlToken;
  let tokens: Token[] = [rootUlToken];
  const match = matchWithListRegxp(listString) as RegExpMatchArray;

  id += 1;
  const listToken: Token = {
    id,
    elmType: LIST,
    content: "", // Indent level
    parent,
  };
  tokens.push(listToken);
  const listText: Token[] = _tokennizeText(match[3], id, listToken);
  id += listText.length;
  tokens.push(...listText);
  return tokens;
};
