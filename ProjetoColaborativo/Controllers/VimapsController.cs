﻿using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Web;
using System.Web.Mvc;
using Microsoft.AspNet.Identity;
using ProjetoColaborativo.Models.DAO;
using ProjetoColaborativo.Models.Entidades;

namespace ProjetoColaborativo.Controllers
{
    public class VimapsController : Controller
    {
        private readonly IRepositorio<Usuario> _repositorioUsuarios;
        private readonly IRepositorio<SessaoColaborativa> _repositorioSessaoColaborativa;
        private readonly IRepositorio<ObjetoSessao> _repositorioObjetosSessaoColaborativa;

        public VimapsController(IRepositorio<Usuario> repositorioUsuarios,
                                IRepositorio<SessaoColaborativa> repositorioSessaoColaborativa,
                                IRepositorio<ObjetoSessao> repositorioObjetosSessaoColaborativa)
        {
            this._repositorioUsuarios = repositorioUsuarios;
            this._repositorioSessaoColaborativa = repositorioSessaoColaborativa;
            this._repositorioObjetosSessaoColaborativa = repositorioObjetosSessaoColaborativa;
        }

        [HttpPost]
        public ActionResult SendImage(string imgdata)
        {
            // Saving
            if (!string.IsNullOrEmpty(imgdata))
            {
                var imagespath = Server.MapPath("~/UserData/Images");
                if (!Directory.Exists(imagespath))
                    Directory.CreateDirectory(imagespath);

                var jpgEncoder = GetEncoder(ImageFormat.Png);
                var myEncoder = Encoder.Quality;
                var myEncoderParameters = new EncoderParameters(1);
                var myEncoderParameter = new EncoderParameter(myEncoder, 90L);
                myEncoderParameters.Param[0] = myEncoderParameter;

                var filename = DateTime.Now.ToString("yyyyMMddhhmmss") + "_" + Guid.NewGuid() + ".jpg";
                var str64 = imgdata.Split(',')[1];
                var bytes = Convert.FromBase64String(str64);

                Image image;
                using (var ms = new MemoryStream(bytes))
                {
                    image = Image.FromStream(ms);
                }

                image.Save(imagespath + "/" + filename, jpgEncoder, myEncoderParameters);
                TempData["ThumbImageSavedURL"] = "/UserData/Images/" + filename;
            }

            return RedirectToAction("MostrarSessao");
        }

        [Authorize]
        public ActionResult MostrarSessao(long? id)
        {
            if (id == null)
                return RedirectToAction("EscolherSessao");

            Usuario usuario = _repositorioUsuarios.RetornarTodos().FirstOrDefault(x => x.Login.Equals(User.Identity.Name));
            SessaoColaborativa sessao = usuario.SessoesColaborativas.FirstOrDefault(x => x.Handle == id);

            if (sessao == null)
                return RedirectToAction("EscolherSessao");

            return View(sessao);
        }

        [Authorize]
        public ActionResult EscolherSessao()
        {
            Usuario usuario = _repositorioUsuarios.RetornarTodos().FirstOrDefault(x => x.Login.Equals(User.Identity.Name));
            
            ViewBag.SessaoColaborativaId = new SelectList(
                usuario.SessoesColaborativas,
                "Handle",
                "Descricao"
            );


            return View(usuario);
        }

        [Authorize]
        [HttpPost]
        public ActionResult EscolherSessao(string SessaoColaborativaId)
        {
            if (!string.IsNullOrEmpty(SessaoColaborativaId))
            {
                SessaoColaborativa sessao = _repositorioSessaoColaborativa.Retornar(long.Parse(SessaoColaborativaId));

                if (sessao != null)
                {
                    var img = TempData["ThumbImageSavedURL"];
                    if (img != null)
                    {
                        ObjetoSessao os = new ObjetoSessao()
                        {
                            SessaoColaborativa = sessao,
                            UrlImagem = img.ToString(),
                            DataCriacao = DateTime.Now
                        };
                        _repositorioObjetosSessaoColaborativa.Salvar(os);
                    }

                    return RedirectToAction("MostrarSessao", "Vimaps", new { id = SessaoColaborativaId });
                }

            }

            return View();
        }

        [Authorize]
        [HttpPost]
        public ActionResult CriarSessaoColaborativa(string descricao)
        {
            Usuario usuario = _repositorioUsuarios.RetornarTodos().FirstOrDefault(x => x.Login.Equals(User.Identity.Name));

            if (!string.IsNullOrEmpty(descricao))
            {
                SessaoColaborativa sessao = new SessaoColaborativa()
                {
                    Usuario = usuario,
                    DataCriacao = DateTime.Now,
                    Descricao = descricao
                };

                var img = TempData["ThumbImageSavedURL"];
                if (img != null)
                {
                    ObjetoSessao os = new ObjetoSessao()
                    {
                        SessaoColaborativa = sessao,
                        UrlImagem = img.ToString(),
                        DataCriacao = DateTime.Now
                    };
                    _repositorioObjetosSessaoColaborativa.Salvar(os);
                }

                _repositorioSessaoColaborativa.Salvar(sessao);
            }

            return View("EscolherSessao", usuario);
        }

        private ImageCodecInfo GetEncoder(ImageFormat format)
        {
            var codecs = ImageCodecInfo.GetImageDecoders();

            foreach (var codec in codecs)
                if (codec.FormatID == format.Guid)
                    return codec;

            return null;
        }
    }
}