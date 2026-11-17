import componentListJson from '../data/component_list.json' with { type: 'json' }
import tokensJson from '../data/design-tokens.json' with { type: 'json' }
import mappingJson from '../data/shadcn-mapping.json' with { type: 'json' }
import type { ComponentList, Mapping, TokenFile } from './types.ts'

export type * from './types.ts'

// `satisfies` makes the type checker validate the JSON files against the schema.
export const defaultTokens: TokenFile = tokensJson satisfies TokenFile
export const mapping: Mapping = mappingJson satisfies Mapping
export const componentList: ComponentList = componentListJson satisfies ComponentList
