{
  description = "Effect TanStack Start dev shell and docker build helpers";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.11";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
        buildDocker = pkgs.writeShellApplication {
          name = "build-docker";
          runtimeInputs = [ pkgs.docker ];
          text = ''
            docker build -t effect-tanstack-start .
          '';
        };
      in
      {
        devShells.default = pkgs.mkShell {
          packages = [
            pkgs.bun
            pkgs.nodejs_20
            pkgs.k6
            pkgs.docker
            pkgs.docker-compose
            pkgs.git
          ];
        };

        apps.build-docker = {
          type = "app";
          program = "${buildDocker}/bin/build-docker";
        };
      });
}
