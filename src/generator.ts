import { Token } from "./models/token";
import { MergedToken } from "./models/merged_token";

/**
 * 全てのTokenがRootの直下にあるかどうか。
 * @param tokens
 * @returns
 */
const isAllElmParentRoot = (tokens: Array<Token | MergedToken>) => {
  return tokens.map((t) => t.parent?.elmType).every((val) => val === "root");
};

/**
 * MergedTokenのcontentにおいて、新たなコンテンツを挿入する位置を返す。
 *
 * もしすでにMergedTokenのcontentにhtmlの要素が含まれる場合はその子の中に挿入。
 * @param content
 * @returns
 */
export const _getInsertPosition = (content: string) => {
  let state = 0; //0: 開始タグを読み込む前、1:開始タグを読み込んだ後〜（つまり何かの要素のコンテンツを読んでるフェーズ）
  const closeTagParentheses = ["<", ">"];
  let position = 0;
  content.split("").some((c, i) => {
    if (state === 1 && c === closeTagParentheses[state]) {
      position = i;
      return true;
    } else if (state === 0 && c === closeTagParentheses[state]) {
      state++;
    }
  });
  return position + 1;
};

/**
 * currentTokenをparentTokenにマージし、そのマージ結果のcontentを返す。
 * @param currentToken
 * @param parentToken
 * @returns
 */
const _createMergedContent = (
  currentToken: Token | MergedToken,
  parentToken: Token | MergedToken
) => {
  let content = "";
  switch (parentToken.elmType) {
    case "li":
      content = `<li>${currentToken.content}</li>`;
      break;
    case "ul":
      content = `<ul>${currentToken.content}</ul>`;
      break;
    case "strong":
      content = `<strong>${currentToken.content}</strong>`;
      break;
    case "merged":
      const position = _getInsertPosition(parentToken.content);
      content = `${parentToken.content.slice(0, position)}${
        currentToken.content
      }${parentToken.content.slice(position)}`;
  }
  return content;
};

/**
 *
 * @param tokens ある行に含まれるトークンたち
 * @returns
 */
const _generateHtmlString = (tokens: Array<Token | MergedToken>) => {
  return tokens
    .map((t) => t.content)
    .reverse() //さっきFIFO順にするためにリバースしたが、コンテンツの順番は元の順番にしたいのでまたリバース
    .join(""); //連結
};

const generate = (asts: Token[][]) => {
  const htmlStrings = asts.map((lineTokens) => {
    //lineTokensはある1行のTokenを表す
    let rearrangedAst: Array<Token | MergedToken> = lineTokens.reverse(); //FIFO順で読み取るためにリバース（最後に入ったやつが最初に出る）
    while (!isAllElmParentRoot(rearrangedAst)) {
      let index = 0;
      while (index < rearrangedAst.length) {
        if (rearrangedAst[index].parent?.elmType === "root") {
          //Rootにあるトークンの場合何もしない。
          index++;
        } else {
          const currentToken = rearrangedAst[index];
          rearrangedAst = rearrangedAst.filter((_, t) => t !== index); //currentTokenを省く
          const parentIndex = rearrangedAst.findIndex(
            (t) => t.id == currentToken.parent.id
          );
          const parentToken = rearrangedAst[parentIndex]; //currentTokenの親要素を探す
          const mergedToken: MergedToken = {
            id: parentToken.id,
            elmType: "merged",
            content: _createMergedContent(currentToken, parentToken),
            parent: parentToken.parent,
          };
          rearrangedAst.splice(parentIndex, 1, mergedToken); //parentTokenをmergedTokenで置き換え
          // parentとマージする。
          // つまり2つ変更する。子は削除。親は置き換え。
          // 1つ親と合成したら1つ要素を消す。のでindexは変わらず。なのでマージしない時のみindex++する。
        }
      }
    }

    return _generateHtmlString(rearrangedAst);
  });
  return htmlStrings.join("");
};

export { generate };
