import { AddDiv } from '../engine/viewer/domutils.js';
import { ThreeModelLoader } from '../engine/threejs/threemodelloader.js';
import { ShowMessageDialog } from './dialogs.js';
import { ButtonDialog, ProgressDialog } from './dialog.js';
import { AddSvgIconElement } from './utils.js';
import { ImportErrorCode } from '../engine/import/importer.js';

export class ThreeModelLoaderUI
{
    constructor ()
    {
        this.modelLoader = new ThreeModelLoader ();
        this.modalDialog = null;
    }

    LoadModel (inputFiles, settings, callbacks)
    {
        if (this.modelLoader.InProgress ()) {
            return;
        }

        let progressDialog = null;
        this.modelLoader.LoadModel (inputFiles, settings, {
            onLoadStart : () => {
                this.CloseDialogIfOpen ();
                callbacks.onStart ();
                progressDialog = new ProgressDialog ();
                progressDialog.Init ('正在加载模型');
                progressDialog.Open ();
            },
            onFileListProgress : (current, total) => {
            },
            onFileLoadProgress : (current, total) => {
            },
            onSelectMainFile : (fileNames, selectFile) => {
                progressDialog.Close ();
                this.modalDialog = this.ShowFileSelectorDialog (fileNames, (index) => {
                    progressDialog.Open ();
                    selectFile (index);
                });
            },
            onImportStart : () => {
                progressDialog.SetText ('正在导入模型');
            },
            onVisualizationStart : () => {
                progressDialog.SetText ('正在展示模型');
            },
            onModelFinished : (importResult, threeObject) => {
                progressDialog.Close ();
                callbacks.onFinish (importResult, threeObject);
            },
            onTextureLoaded : () => {
                callbacks.onRender ();
            },
            onLoadError : (importError) => {
                progressDialog.Close ();
                callbacks.onError (importError);
                this.modalDialog = this.ShowErrorDialog (importError);
            },
        });
    }

    GetModelLoader ()
    {
        return this.modelLoader;
    }

    GetImporter ()
    {
        return this.modelLoader.GetImporter ();
    }

    ShowErrorDialog (importError)
    {
        if (importError.code === ImportErrorCode.NoImportableFile) {
            return ShowMessageDialog (
                '错误',
                '该文件不支持展示',
                null
            );
        } else if (importError.code === ImportErrorCode.FailedToLoadFile) {
            return ShowMessageDialog (
                '错误',
                '加载模型失败',
                '远程模型文件读取失败'
            );
        } else if (importError.code === ImportErrorCode.ImportFailed) {
            return ShowMessageDialog (
                '错误',
                '加载模型失败',
                importError.message
            );
        } else {
            return ShowMessageDialog (
                '错误',
                '未知的错误',
                null
            );
        }
    }

    ShowFileSelectorDialog (fileNames, onSelect)
    {
        let dialog = new ButtonDialog ();
        let contentDiv = dialog.Init ('选择模型', [
            {
                name : '取消',
                subClass : 'outline',
                onClick () {
                    dialog.Close ();
                }
            }
        ]);
        dialog.SetCloseHandler (() => {
            onSelect (null);
        });

        let text = '这个文件包含了多个模型，请选择要查看的模型';
        AddDiv (contentDiv, 'ov_dialog_message', text);

        let fileListSection = AddDiv (contentDiv, 'ov_dialog_section');
        let fileList = AddDiv (fileListSection, 'ov_dialog_import_file_list ov_thin_scrollbar');

        for (let i = 0; i < fileNames.length; i++) {
            let fileName = fileNames[i];
            let fileLink = AddDiv (fileList, 'ov_dialog_file_link');
            AddSvgIconElement (fileLink, 'meshes', 'ov_file_link_img');
            AddDiv (fileLink, 'ov_dialog_file_link_text', fileName);
            fileLink.addEventListener ('click', () => {
                dialog.SetCloseHandler (null);
                dialog.Close ();
                onSelect (i);
            });
        }

        dialog.Open ();
        return dialog;
    }

    CloseDialogIfOpen ()
    {
        if (this.modalDialog !== null) {
            this.modalDialog.Close ();
            this.modalDialog = null;
        }
    }
}
