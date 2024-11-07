{
  description = "Nix flake Node.js development environment";

  inputs = {
    nixpkgs-unstable.url = "github:nixos/nixpkgs/nixos-unstable";
  };

  outputs =
    { nixpkgs-unstable, ... }:
    let
      system = "x86_64-linux";

    in
    {
      devShells.${system}.default =
        let
          pkgs = import nixpkgs-unstable { inherit system; };

        in
        pkgs.mkShell {
          packages = [
            # node 22.10.0
            pkgs.nodejs_22

            # playwright 1.47.0
            # version in package.json must match
            pkgs.playwright-driver.browsers

            # dotenvx 1.14.2
            # load env variables in a way that playwright can access
            pkgs.dotenvx
          ];

          PLAYWRIGHT_BROWSERS_PATH = "${pkgs.playwright-driver.browsers}";
        };
    };
}
