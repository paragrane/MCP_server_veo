from setuptools import setup, find_packages

setup(
    name="mcp-server-google-veo",
    version="1.0.0",
    description="MCP server for Google Veo video generation",
    author="",
    license="MIT",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    python_requires=">=3.10",
    install_requires=[
        "mcp>=1.0.0",
        "google-generativeai>=0.8.0",
        "python-dotenv>=1.0.0",
        "asyncio-atexit>=1.0.1",
    ],
    entry_points={
        "console_scripts": [
            "mcp-server-veo=server:main",
        ],
    },
)
