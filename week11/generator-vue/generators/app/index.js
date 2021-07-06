var Generator = require('yeoman-generator');

module.exports = class extends Generator {
    constructor(args, opts) {
        super(args, opts);
    }
    async initPackage() {
        let answer = await this.prompt([{
            type: "input",
            name: "name",
            message: "Your project name",
            default: this.appname
        }])
        const pkgJson = {
            "name": answer.name,
            "version": "1.0.0",
            "description": "",
            "main" : "generators/app/index.js",
            "scripts": {
                "test": "mocha --require @babel/register"
            },
            "author": "",
            "license": "ISC",
            "devDependencies": {

            },
            "dependencies": {

            }
        };
        // Extend or create package.json file in destination path
        this.fs.extendJSON(this.destinationPath('package.json'), pkgJson);
        this.npmInstall(["webpack", "webpack-cli", "vue-loader", "vue-style-loader", "css-loader", "vue-template-compiler", "copy-webpack-plugin"], {'save-dev': true});
        this.fs.copyTpl(
            this.templatePath('sample-test.js'),
            this.destinationPath('test/sample-test.js'),
            {}
        );
        this.fs.copyTpl(
            this.templatePath('HelloWorld.vue'),
            this.destinationPath('src/HelloWorld.vue'),
            {}
        );
        this.fs.copyTpl(
            this.templatePath('webpack.config.js'),
            this.destinationPath('webpack.config.js')
        );
        this.fs.copyTpl(
            this.templatePath('main.js'),
            this.destinationPath('src/main.js')
        );
        this.fs.copyTpl(
            this.templatePath('index.html'),
            this.destinationPath('src/index.html')
        );
    }
}