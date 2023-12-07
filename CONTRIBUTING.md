# How to Contribute

We'd love to accept your patches and contributions to this project. There are just a few small guidelines you need to follow.

## Contributor License Agreement

Contributions to this project must be accompanied by a Contributor License Agreement. You (or your employer) retain the copyright to your
contribution, this simply gives us permission to use and redistribute your contributions as part of the project. Head over to
<https://cla.developers.google.com/> to see your current agreements on file or to sign a new one.

You generally only need to submit a CLA once, so if you've already submitted one (even if it was for a different project), you probably don't need to
do it again.

## Code reviews

All submissions, including submissions by project members, require review. We use GitHub pull requests for this purpose. Consult
[GitHub Help](https://help.github.com/articles/about-pull-requests/) for more information on using pull requests.

## Code linting

We use a pre-commit hook to clean/format code before submitting a change. This allows for a cleaner code base. pre-commit will fetch and trigger the
_prettier_ and _markdown_ link tools and run it through your staged files.

Install pre-commit on your cloud top

```shell
sudo apt install pre-commit
```

Then install the git hook :

```shell
pre-commit install
```

you can also run pre-commit on all the files manually before committing your changes :

```shell
pre-commit run --all-files
```

more information about pre-commit : <https://pre-commit.com/>
