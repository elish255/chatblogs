<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Preserve the reference ChatBlog markup, CSS, and simulation logic as local source files, mounting them at `/` through the TanStack route; this keeps its visual composition and interactions faithful rather than rewriting a large established interface.
- Bundle reference profile photographs as a single local sprite and store the reference logo as a project asset pointer; this avoids external image hotlinks while retaining the original visuals.
