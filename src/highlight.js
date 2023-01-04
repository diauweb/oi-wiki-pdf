import latex from 'highlight.js/lib/languages/latex'
import dos from 'highlight.js/lib/languages/dos'
import vim from 'highlight.js/lib/languages/vim'
import cmake from 'highlight.js/lib/languages/cmake'
import powershell from 'highlight.js/lib/languages/powershell'
import x86asm from 'highlight.js/lib/languages/x86asm'
import delphi from 'highlight.js/lib/languages/delphi'
import hy from 'highlight.js/lib/languages/hy'
import haskell from 'highlight.js/lib/languages/haskell'

export default {
  languages: { latex, dos, vim, cmake, powershell, x86asm, delphi, hy, haskell },
  plainText: ['plain' ],
  aliases: { dos: ['doscon'], powershell: ['ps1con'] }
}
