from setuptools import setup, find_packages

with open("requirements.txt") as f:
    install_requires = f.read().strip().split("\n")

setup(
    name="dana_group",
    version="0.0.1",
    description="Dana Group App",
    author="Muhammad Zubair",
    author_email="zubairmazhar23@gmail.com",
    packages=find_packages(),
    zip_safe=False,
    include_package_data=True,
    install_requires=install_requires,
)
