import { Token } from "./token";
export type MergedToken = {
  id: number;
  elmType: string;
  content: string;
  parent: Token | MergedToken;
};
