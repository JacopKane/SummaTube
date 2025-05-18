Create a file in a repository that automatically adds information to questions you ask Copilot Chat.

## [Prerequisites for repository custom instructions](https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot#prerequisites-for-repository-custom-instructions)

-   A custom instructions file (see the instructions below).

## [Creating a repository custom instructions file](https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot#creating-a-repository-custom-instructions-file)

1.  In the root of your repository, create a file named `.github/copilot-instructions.md`.
    
    Create the `.github` directory if it does not already exist.
    
2.  Add natural language instructions to the file, in Markdown format.
    
    Whitespace between instructions is ignored, so the instructions can be written as a single paragraph, each on a new line, or separated by blank lines for legibility.
    

To see your instructions in action, go to [https://github.com/copilot](https://github.com/copilot), attach the repository containing the instructions file, and start a conversation.

Did you successfully add a custom instructions file to your repository?

[Yes](https://docs.github.io/success-test/yes.html) [No](https://docs.github.io/success-test/no.html)

## [Writing effective repository custom instructions](https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot#writing-effective-repository-custom-instructions)

The instructions you add to the `.github/copilot-instructions.md` file should be short, self-contained statements that add context or relevant information to supplement users' chat questions.

You should also consider the size and complexity of your repository. The following types of instructions may work for a small repository with only a few contributors, but for a large and diverse repository, they may cause problems with other areas of Copilot:

-   Requests to refer to external resources when formulating a response
-   Instructions to answer in a particular style
-   Requests to always respond with a certain level of detail

For example, the following instructions may not have the intended results:

```less
Always conform to the coding styles defined in styleguide.md in repo my-org/my-repo when generating code.

Use @terminal when answering questions about Git.

Answer all questions in the style of a friendly colleague, using informal language.

Answer all questions in less than 1000 characters, and words of no more than 12 characters.
```

## [Repository custom instructions in use](https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot#repository-custom-instructions-in-use)

## [Enabling or disabling repository custom instructions](https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot#enabling-or-disabling-repository-custom-instructions)

You can choose whether or not to have custom instructions added to your chat questions.