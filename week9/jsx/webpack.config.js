const path = require("path");
module.exports = {
    entry: "./main.js",
    output: {
        path: path.resolve(__dirname, 'dist'), //打包后存放的地址
        publicPath: '/dist', //访问文件时用的地址
        filename: '[name].js'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env"],
                        plugins: [["@babel/plugin-transform-react-jsx", { pragma: "createElement" }]]
                    }
                }
            }
        ]
    },
    mode: "development"
}