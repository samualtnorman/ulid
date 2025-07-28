let inherit (import <nixpkgs> {}) fetchFromGitHub mkShellNoCC cacert git; in

let fetchNixpkgs =
	{ rev, sha256 ? "" }: import (fetchFromGitHub { owner = "NixOS"; repo = "nixpkgs"; inherit rev sha256; }) {}; in

let inherit (fetchNixpkgs {
	rev = "db8414903dd6b3042e1ac471eafc18ca4ccb54a4"; # 24.11 2025/06/16
	sha256 = "izgPGLeUeFB9loC+n2X6TO2n8pOGvVcR3jKqxTGOwgc=";
}) nodejs_22 pnpm_10; in

mkShellNoCC { packages = [ cacert git nodejs_22 pnpm_10 ]; }
