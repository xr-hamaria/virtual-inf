# virtual-inf
Faculty of Informatics, Shizuoka University (Virtual Edition)



## Getting Started

8月以降、 https://xr-hamaria.github.io/virtual-inf にて公開を予定しています。

### ローカルテストサーバで実行する

[python.org](https://www.python.org/downloads/) から Python 3.x.x をインストールします。  
インストーラの最初のページで、"Add Python 3.xxx to PATH" にチェックを入れます。  
インストールが完了したら、Windowsならコマンドプロンプト、Mac/Linuxならターミナルを起動します。

次のコマンドを入力します。  
```python -V```  
Pythonがインストールできていれば、バージョン名が返されます。

当ページ右上のCloneから、プログラムを任意の場所にダウンロードして展開してください。  
（もちろんOpen in Desktopでもgit cloneでも構いません）

C:\Users\USERNAME\Documents\GitHub\virtual-infにダウンロードした場合、  
```cd C:\Users\USERNAME\Documents\GitHub\virtual-inf```  
でカレントディレクトリを変更し、  
```python -m http.server```  
でサーバーを起動します。

この状態で、ウェブブラウザにて http://localhost:8000 にアクセスしてください。

参考: [MDN web docs](https://developer.mozilla.org/ja/docs/Learn/Common_questions/set_up_a_local_testing_server)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

(c) 2020 Shizuoka University  
(c) 2020 Shizuoka University xR Association "Hamaria"