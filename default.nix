{ pkgs ? import <nixpkgs> {} }:

pkgs.stdenv.mkDerivation {
  name = "api-card";
  src = ./.;

  buildInputs = [
    pkgs.nodejs
    # Exclude conflicting packages or use specific versions
    # Example: pkgs.someConflictingPackage
  ];

  installPhase = ''
    mkdir -p $out/bin
    cp -r * $out/bin/
  '';
}