$('#form_rubrique .btn-reset').click(function(){
	$.confirm({
	    title: 'Effacer le contenu des champs',
	    content: 'Voulez-vous vraiment vider les champs du formulaire?',
	    buttons: {
	        confirm: {
	        	text: "Oui",
	        	btnClass: 'btn-info',
	        	action : function () {
	        	    vider_formulaire("form_rubrique");
	        	}
	        },
	        cancel: {
	        	text: "Non",
	        	action : function () {
	        	    //$.alert('Confirmed!');
	        	}
	        }
	    }
	});
})

$('#form_article .btn-reset').click(function(){
	$.confirm({
	    title: 'Effacer le contenu des champs',
	    content: 'Voulez-vous vraiment vider les champs du formulaire?',
	    buttons: {
	        confirm: {
	        	text: "Oui",
	        	btnClass: 'btn-info',
	        	action : function () {
	        	    vider_formulaire("form_article");
	        	}
	        },
	        cancel: {
	        	text: "Non",
	        	action : function () {
	        	    //$.alert('Confirmed!');
	        	}
	        }
	    }
	});
})

$('#form_mot .btn-reset').click(function(){
	$.confirm({
	    title: 'Effacer le contenu des champs',
	    content: 'Voulez-vous vraiment vider les champs du formulaire?',
	    buttons: {
	        confirm: {
	        	text: "Oui",
	        	btnClass: 'btn-info',
	        	action : function () {
	        	    vider_formulaire("form_mot");
	        	}
	        },
	        cancel: {
	        	text: "Non",
	        	action : function () {
	        	    //$.alert('Confirmed!');
	        	}
	        }
	    }
	});
})


$('#form_groupe .btn-reset').click(function(){
	$.confirm({
	    title: 'Effacer le contenu des champs',
	    content: 'Voulez-vous vraiment vider les champs du formulaire?',
	    buttons: {
	        confirm: {
	        	text: "Oui",
	        	btnClass: 'btn-info',
	        	action : function () {
	        	    vider_formulaire("form_groupe");
	        	}
	        },
	        cancel: {
	        	text: "Non",
	        	action : function () {
	        	    //$.alert('Confirmed!');
	        	}
	        }
	    }
	});
})
	
$('#form_auteur .btn-reset').click(function(){
	$.confirm({
	    title: 'Effacer le contenu des champs',
	    content: 'Voulez-vous vraiment vider les champs du formulaire?',
	    buttons: {
	        confirm: {
	        	text: "Oui",
	        	btnClass: 'btn-info',
	        	action : function () {
	        	    vider_formulaire("form_auteur");
	        	}
	        },
	        cancel: {
	        	text: "Non",
	        	action : function () {
	        	    //$.alert('Confirmed!');
	        	}
	        }
	    }
	});
})

$('#form_donnee_valide .btn-reset').click(function(){
	$.confirm({
	    title: 'Effacer le contenu des champs',
	    content: 'Voulez-vous vraiment vider les champs du formulaire?',
	    buttons: {
	        confirm: {
	        	text: "Oui",
	        	btnClass: 'btn-info',
	        	action : function () {
	        	    vider_formulaire("form_groupe");
	        	}
	        },
	        cancel: {
	        	text: "Non",
	        	action : function () {
	        	    //$.alert('Confirmed!');
	        	}
	        }
	    }
	});
})

function vider_formulaire(id){
	$('#'+id).trigger("reset");
	if ($('.summernote').length>0) {$('.summernote').summernote('code','');};
	

}


$(document).ajaxComplete(function () {
	 $('.doc_del').on('click',function(e){
	e.preventDefault();
                    	//alert('nf');return;
						var i = $(this).attr('i');
						var current_row = $(this).closest('.items');
						$.confirm({
						    title: 'Confirmer la mise en corbeille',
						    content: 'Ce document sera mis en corbeille',
						    buttons: {
						        confirm: {
						        	text: "OK",
						        	btnClass: 'btn-info',
						        	action : function () {
						        	    move_document(i,current_row);
						        	}
						        },
						        cancel: {
						        	text: "Annuler",
						        	action : function () {
						        	    //$.alert('Confirmed!');
						        	}
						        }
						    }
						});
					});
    /**/$.HSCore.components.HSDropdown.init($('[data-dropdown-target]'), {
                      dropdownHideOnScroll: false,
                      dropdownType: 'css-animation',
                      dropdownAnimationIn: 'fadeIn',
                      dropdownAnimationOut: 'fadeOut'
                    });
    //alert('eg')

   

});

$("#cnt_pagination").on('click','a',function(e){
	e.preventDefault() ;
	//alert('ee');//return;
    $.ajax({
	   type: "POST",
	   url: $(this).attr("href"),
	   cache: false,
	   contentType: false,
	   dataType:'JSON',
	   processData: false,
	   success: function(res){
	   	//console.log(res);return;
	   	// maj des liens de paginations
	    $("#cnt_pagination").html(res.links);
	    // maj des documents
	    $(".srubriques").html(res.documents);
	    //$("#cnt_pagination").html(res.links);

	    
	   },
	   error: function(jqXHR, textStatus, errorThrown) {
		    console.log(jqXHR.responseText);
		}
   	});
   //return false;
   });

$(".s_cnt_links").on('click','a',function(e){
	e.preventDefault() ;
    $.ajax({
	   type: "POST",
	   url: $(this).attr("href"),
	   cache: false,
	   contentType: false,
	   dataType:'JSON',
	   processData: false,
	   success: function(res){
	   	//console.log(res);return;
	   	// maj des liens de paginations
	   	if (res.objet=="articles") {
		   	$(".s_art_links").html(res.links);
		    // maj des documents
		    $(".s_art_cnt").html(res.infos);	
	   	}

	   	if (res.objet=="rubriques") {
		   	$(".s_rub_links").html(res.links);
		    // maj des documents
		    $(".s_rub_cnt").html(res.infos);	
	   	}

	   	if (res.objet=="documents") {
		   	$(".s_doc_links").html(res.links);
		    // maj des documents
		    $(".s_doc_cnt").html(res.infos);	
	   	}

	   	if (res.objet=="mots") {
		   	$(".s_mot_links").html(res.links);
		    // maj des documents
		    $(".s_mot_cnt").html(res.infos);	
	   	}

	   	if (res.objet=="groupes") {
		   	$(".s_grp_links").html(res.links);
		    // maj des documents
		    $(".s_grp_cnt").html(res.infos);	
	   	}

	   	if (res.objet=="auteurs") {
		   	$(".s_aut_links").html(res.links);
		    // maj des documents
		    $(".s_aut_cnt").html(res.infos);	
	   	}
	    
	    //$("#cnt_pagination").html(res.links);
	   },
	   error: function(jqXHR, textStatus, errorThrown) {
		    console.log(jqXHR.responseText);
		}
   	});
   //return false;
   });

$('select[name=doc_type]').change(function(){
	var value = $(this).val();

	//$('#zvideo').css('display','none');
	//$('#zfichier').css('display','none');
	if (value==1) {
		$('#zfichier').removeClass('hidden');
		$('#zfichier').addClass('shown');
		if ($('#zvideo').hasClass('shown')) {
			$('#zvideo').addClass('hidden');
			$('#zvideo').removeClass('shown');
		}
		
	}else if(value==2){
		$('#zvideo').removeClass('hidden');
		$('#zvideo').addClass('shown');
		if ($('#zfichier').hasClass('shown')) {
			$('#zfichier').addClass('hidden');
			$('#zfichier').removeClass('shown');
		}
	}else{
		$('#zvideo').removeClass('shown');
		$('#zvideo').addClass('hidden');
		$('#zfichier').removeClass('shown');
		$('#zfichier').addClass('hidden');
	}

})

$(document).ready(function () {
                        $.fn.extend({
                            placeCursorAtEnd: function () {
                                // Places the cursor at the end of a contenteditable container (should also work for textarea / input)
                                if (this.length === 0) {
                                    throw new Error("Cannot manipulate an element if there is no element!");
                                }
                                var el = this[0];
                                var range = document.createRange();
                                var sel = window.getSelection();
                                var childLength = el.childNodes.length;
                                if (childLength > 0) {
                                    var lastNode = el.childNodes[childLength - 1];
                                    var lastNodeChildren = lastNode.childNodes.length;
                                    range.setStart(lastNode, lastNodeChildren);
                                    range.collapse(true);
                                    sel.removeAllRanges();
                                    sel.addRange(range);
                                }
                                return this;
                            }
                        });
});


$('.summernote').summernote({
	height: 300,
	disableDragAndDrop :true,
	callbacks: {
		onInit: function(){
				if($('.summernote').summernote('isEmpty')){
                        $(".note-codable").html('');
                        $(".note-editable").html('');
                    }
                    summernoteValidatorAdd.element($('.summernote'));
            
            $('.note-insert button[aria-label="Picture"]').click(function(event) {
            	$('div[aria-label="Insert Image"]').modal('hide');
            	$('#myModal').modal('show');
            });

            $('#new_rub_desc .note-insert button[aria-label="Picture"]').addClass('hide')
            
    		//replaceCodes(note_editable);
		},	    
	    onKeyup: function(e) {
	    	
			var contents = $('.note-editable').html();
			//contents = contents.replace("[IMG_16]", "<img src='https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE1Mu3b?ver=5c31' />")
			//contents = contents.replace(/\[MS_DOC_16\]/g, '<img src="https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE1Mu3b?ver=5c31">')
			
			
	    }

	}
});

$('#rlogo_art').click(function(){
	var i = $(this).attr('i');
	$.confirm({
	    title: 'Supprimer le logo',
	    content: 'Voulez-vous vraiment supprimer le logo?',
	    buttons: {
	        confirm: {
	        	text: "Oui",
	        	btnClass: 'btn-info',
	        	action : function () {
	        	    location.href=base_url+""+"articles/sup_logo/"+i;
	        	}
	        },
	        cancel: {
	        	text: "Non",
	        	action : function () {
	        	    //$.alert('Confirmed!');
	        	}
	        }
	    }
	});
})
$('#rlogo_rub').click(function(){
	var i = $(this).attr('i');
	$.confirm({
	    title: 'Supprimer le logo',
	    content: 'Voulez-vous vraiment supprimer le logo?',
	    buttons: {
	        confirm: {
	        	text: "Oui",
	        	btnClass: 'btn-info',
	        	action : function () {
	        	    location.href=base_url+""+"rubriques/sup_logo/"+i;
	        	}
	        },
	        cancel: {
	        	text: "Non",
	        	action : function () {
	        	    //$.alert('Confirmed!');
	        	}
	        }
	    }
	});
})

/*var codable_bool = $('.note-editor').hasClass('codeview');
$('.note-view button[aria-label="Code View"]').click(function(event) { 
	var note_codedable = $('.note-codable').text();
	var note_editable = $('.note-editable').html();
    //alert(note_editable);
    var codable = $('.note-editor').hasClass('codeview');
    if (codable) {
    	replaceUrls(note_editable);
    	//note_editable = note_editable.replace(/<img src="https:\/\/img-prod-cms-rt-microsoft-com.akamaized.net\/cms\/api\/am\/imageFileData\/RE1Mu3b\?ver=5c31">/g, "[MS_DOC_16]")
    	//$('.note-codable').val(note_editable);
    
    }else{
    	// replace codes by urls
    	replaceCodes(note_editable);
    	//note_editable = note_editable.replace(/\[MS_DOC_16\]/g, '<img src="https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE1Mu3b?ver=5c31">')
    }
    //alert(codable)
    
			
	//$('.note-editable').html(note_editable);
			return;
});

function replaceUrls(content){

	$url = base_url+'documents/getCodedContent';
    data = new FormData();
    data.append("content", content);
	// appel ajax
	$.ajax({
           url: $url,
           data: data,
           cache: false,
           contentType: false,
           dataType:'JSON',
           processData: false,
           type: 'POST',
            success: function(data){
	           //Mettre à jour l'éditeur
	           console.log(data.content);return;
	           $('.note-codable').val(data.content);
	           //$('.note-editable').html(data.content);
	        },
            error: function(jqXHR, textStatus, errorThrown) {
	           console.log(jqXHR.responseText+" "+errorThrown);
	        }
        }); 
	return false
}

function replaceCodes(content){
	$url = base_url+'documents/getCleanContent';
    data = new FormData();
    data.append("content", content);
	// appel ajax
	$.ajax({
           url: $url,
           data: data,
           cache: false,
           contentType: false,
           dataType:'JSON',
           processData: false,
           type: 'POST',
            success: function(data){
	           //Mettre à jour l'éditeur
	           //console.log(data.content)
	           $('.summernote').summernote('code',data.content)
	           //$('.note-editable').html(data.content);
	        },
            error: function(jqXHR, textStatus, errorThrown) {
	           console.log(jqXHR.responseText+" "+errorThrown);
	        }
        }); 
	return false
}*/

function sendFile(file,opt) {
	$url = base_url+'documents/upload';
    data = new FormData();
    data.append("opt", opt);
    data.append("file", file);
        $.ajax({
           url: $url,
           data: data,
           cache: false,
           contentType: false,
           dataType:'JSON',
           processData: false,
           type: 'POST',
            success: function(data){
	           if (opt=="internet") {
	           	$('.summernote').summernote("insertImage", data.image_url, 'Sans titre');
	           }else{
	           	$('.summernote').summernote("insertImage", data.image_url, 'filename');
	          }

	           
	        },
            error: function(jqXHR, textStatus, errorThrown) {
	           console.log(jqXHR.responseText+" "+errorThrown);
	        }
        }); 
}

$('.modal_doc').click(function(e){
	e.preventDefault();
	var url = $(this).find('a').attr('href');
	var titre = $(this).find('a').find('small').text();
	$('.summernote').summernote("insertImage", url, titre);
	$('#myModal').modal('hide');
})

$('#insertDoc').click(function(e){
	e.preventDefault();
	$("input:checkbox[class=r_doc]:checked").each(function(){
		$(this).prop('checked',false);
	    var items = $(this).closest('.items');	   
		var url = items.find('a').attr('href');
		//var titre = $(this).find('a').find('small').text();
		$('.summernote').summernote("insertImage", url, "titre");
		$('#myModal').modal('hide');
	});
})

/*$('#insertDoc').click(function(e){
	e.preventDefault();
	var internet = $('input[name=image-url]').val();
	var newdoc = $('input[name=newdoc]')[0].files[0];
	var opt = "";
	if (internet!="" || newdoc!=null) {
		// si option téleversement local
		if (newdoc!=null) {
			opt = "local";
			sendFile(newdoc,opt);
		}
		if(internet!=""){
			// si option téleversement depuis internet
			opt = "internet";
			sendFile(internet,opt);
		}		
		//$('.summernote').summernote("insertImage", internet, 'Sans titre');
		$('input[name=image-url]').val("");
		$('#myModal').modal('hide');
		$('input[name=newdoc]').val(null);
	}else{
		if (internet=="" && newdoc==null) {
			alert('Veuillez choisir une option en renseignant l\'un des champs depuis votre ordinateur ou internet.');
		}else if(internet==""){

			alert('Veuillez renseigner le lien vers le fichier sur internet SVP.');
		}
		else{
			alert('Veuillez sélectionner un fichier SVP.');
		}
	}
	var titre = $(this).find('a').find('small').text();
	//$('.summernote').summernote("insertImage", url, titre);
	//$('#myModal').modal('hide');
})*/

$('#rdoc').click(function(e){
	e.preventDefault();
	var d ="";
	var i =$(this).attr('i');
	$("input:checkbox[class=r_doc]:checked").each(function(){
		d=d+$(this).attr('i')+';';
	});
	$url = base_url+'rubriques/detacher';
    data = new FormData();
    data.append("d", d);
    data.append("i", i);
    $.confirm({
	    title: 'Détachement des documents',
	    content: 'Voulez-vous vraiment détacher les documents cochés de la rubrique?',
	    buttons: {
	        confirm: {
	        	text: "Oui",
	        	btnClass: 'btn-info',
	        	action : function () {
	        	    $.ajax({
			           url: $url,
			           data: data,
			           cache: false,
			           contentType: false,
			           dataType:'JSON',
			           processData: false,
			           type: 'POST',
			            success: function(data){
				           console.log(data);
				           if (data.success) {
					           	$("input:checkbox[class=r_doc]:checked").each(function(){
								   $(this).closest('.items').remove();
								});
				           };
				           
				           
				        },
			            error: function(jqXHR, textStatus, errorThrown) {
				           console.log(jqXHR.responseText+" "+errorThrown);
				        }
			        }); 
	        	}
	        },
	        cancel: {
	        	text: "Non",
	        	action : function () {
	        	    //$.alert('Confirmed!');
	        	}
	        }
	    }
	});
        
})

$('#radoc').click(function(e){
	e.preventDefault();
	var d ="";
	var i =$(this).attr('i');
	$("input:checkbox[class=r_doc]:checked").each(function(){
		d=d+$(this).attr('i')+';';
	});
	$url = base_url+'articles/detacher';
    data = new FormData();
    data.append("d", d);
    data.append("i", i);
    $.confirm({
	    title: 'Détachement des documents',
	    content: 'Voulez-vous vraiment détacher les documents cochés de l\'article?',
	    buttons: {
	        confirm: {
	        	text: "Oui",
	        	btnClass: 'btn-info',
	        	action : function () {
	        	    $.ajax({
			           url: $url,
			           data: data,
			           cache: false,
			           contentType: false,
			           dataType:'JSON',
			           processData: false,
			           type: 'POST',
			            success: function(data){
				           console.log(data);
				           if (data.success) {
					           	$("input:checkbox[class=r_doc]:checked").each(function(){
								   $(this).closest('.items').remove();
								});
				           };
				           
				           
				        },
			            error: function(jqXHR, textStatus, errorThrown) {
				           console.log(jqXHR.responseText+" "+errorThrown);
				        }
			        }); 
	        	}
	        },
	        cancel: {
	        	text: "Non",
	        	action : function () {
	        	    //$.alert('Confirmed!');
	        	}
	        }
	    }
	});
        
})
$('#r_ch_all').click(function(e){
	e.preventDefault();

	// si tout est coché
	if ($("input:checkbox[class=r_doc]").length == $("input:checkbox[class=r_doc]:checked").length) {
		$("input:checkbox[class=r_doc]").each(function(){
			$(this).prop('checked',false);
		});
	}else{
		$("input:checkbox[class=r_doc]").each(function(){
			$(this).prop('checked',true);
		});
	}
})
var selected_users_in_grp = [];
$('#search').multiselect({
        search: {
            left: '<input type="text" name="q" class="form-control" placeholder="Rechercher ici..." />',
            right: '<input type="text" name="q" class="form-control" placeholder="Rechercher ici..." />',
        },
        fireSearch: function(value) {
            return value.length > 0;
        }
});



$('input[name=q]').addClass('g-mb-10');
$('.select_mots').select2({
	placeholder:"Cliquez dans le champ pour sélectionner des mots-clés"
});

$('.select_rub_restrict').select2({
	placeholder:"Cliquez dans le champ pour sélectionner des groupes"
});

$('.select_aut_groupe').select2({
	placeholder:"Cliquez dans le champ pour sélectionner des groupes"
});

$('.select_grp_users').select2({
	placeholder:"Cliquez dans le champ pour sélectionner des groupes"
});

$('.select_acces').select2({
	placeholder:"Cliquez dans le champ pour sélectionner des accès"
});

$('.select_privileges').select2({
	placeholder:"Cliquez dans le champ pour sélectionner des privilèges"
});




$('#rub_move').click(function (e){
	e.preventDefault();
	show_loading();
	setTimeout(function(){ hide_loading(); }, 1000);
	var i = $(this).attr('i');
	var ti = $('select[name=movable_rub]').val();
	//alert(ti);return;
	$url = base_url+'rubriques/deplacer';
    data = new FormData();
    data.append("i", i);
    data.append("ti", ti);        
        $.ajax({
           url: $url,
           data: data,
           cache: false,
           contentType: false,
           dataType:'JSON',
           processData: false,
           type: 'POST',
            success: function(data){  
	           if (data.success) {
	           	$('select[name=movable_rub] option:gt(0)').remove();	           	
	           	var $el = $("select[name=movable_rub]");
	           	$.each(data.listeRubriques, function(key,value) {
				    $el.append(
				  	 $("<option></option>")
				     .attr("value", value.id_rubrique).text(value.Indent+value.titre)
				    );
				});
				$el.val(ti)
	           	$.alert({
                    title: 'Déplacement de la rubrique',
                    content: 'La rubrique a été correctement déplacé',
                });

                $('.zone_rub_maj').text(data.date_maj);
                $('.zone_rub_maj').next('a').text(data.nom_auteur.replace('&#8230;','...'));
                $('.zone_rub_maj').next('a').attr('title',nom);
                $('.zone_rub_maj').next('a').attr('href',lien_auteur);
	           }	           
	        },
            error: function(jqXHR, textStatus, errorThrown) {
	           console.log(jqXHR.responseText+" "+errorThrown);
	        }
        }); 
})

$('#art_move').click(function (e){
	e.preventDefault();
	show_loading();
	setTimeout(function(){ hide_loading(); }, 1000);
	var i = $(this).attr('i');
	//alert(i);return
	var ti = $('select[name=movable_art]').val();

	$url = base_url+'articles/deplacer';
    data = new FormData();
    data.append("i", i);
    data.append("ti", ti);        
        $.ajax({
           url: $url,
           data: data,
           cache: false,
           contentType: false,
           dataType:'JSON',
           processData: false,
           type: 'POST',
            success: function(data){  
	           if (data.success) {
	           	$('select[name=movable_art] option:gt(0)').remove();	           	
	           	var $el = $("select[name=movable_art]");
	           	$.each(data.listeRubriques, function(key,value) {
				    $el.append(
				  	 $("<option></option>")
				     .attr("value", value.id_rubrique).text(value.Indent+value.titre)
				    );
				});
				$el.val(ti)
	           	$.alert({
                    title: 'Déplacement de l\'article',
                    content: 'L\'article a été correctement déplacé',
                });

	           	$('.zone_art_maj').text(data.date_maj);
                $('.zone_art_maj').next('a').text(data.nom_auteur.replace('&#8230;','...'));
                $('.zone_art_maj').next('a').attr('title',nom);
                $('.zone_art_maj').next('a').attr('href',lien_auteur);
	           }	           
	        },
            error: function(jqXHR, textStatus, errorThrown) {
	           console.log(jqXHR.responseText+" "+errorThrown);
	        }
        }); 
})


$('#rub_restrictions').click(function (e){
	e.preventDefault();
	show_loading();
	setTimeout(function(){ hide_loading(); }, 1000);
	var i = $(this).attr('i');
	var m = $('#select_restrictions').val();
	$url = base_url+'rubriques/enregistrer_restrictions';
    data = new FormData();
    data.append("i", i);
    data.append("m", m);        
    $.ajax({
           url: $url,
           data: data,
           cache: false,
           contentType: false,
           dataType:'JSON',
           processData: false,
           type: 'POST',
            success: function(data){  
	           if (data.success) {
	           	
	           	$.alert({
                    title: 'Restrictions sur l\'accès',
                    content: 'Les restrictions ont été correctement ajoutées à la rubrique',
                });

                $('.zone_rub_maj').text(data.date_maj);
                $('.zone_rub_maj').next('a').text(data.nom_auteur.replace('&#8230;','...'));
                $('.zone_rub_maj').next('a').attr('title',nom);
                $('.zone_rub_maj').next('a').attr('href',lien_auteur);
	           }	           
	        },
            error: function(jqXHR, textStatus, errorThrown) {
	           console.log(jqXHR.responseText+" "+errorThrown);
	        }
    }); 
});

$('#art_restrictions').click(function (e){
	e.preventDefault();
	show_loading();
	setTimeout(function(){ hide_loading(); }, 1000);
	var i = $(this).attr('i');
	var m = $('#select_restrictions').val();
	$url = base_url+'articles/enregistrer_restrictions';
    data = new FormData();
    data.append("i", i);
    data.append("m", m);        
    $.ajax({
           url: $url,
           data: data,
           cache: false,
           contentType: false,
           dataType:'JSON',
           processData: false,
           type: 'POST',
            success: function(data){  
	           if (data.success) {
	           	
	           	$.alert({
                    title: 'Restrictions sur l\'accès',
                    content: 'Les restrictions ont été correctement ajoutées à l\'article',
                });
                $('.zone_art_maj').text(data.date_maj);
                $('.zone_art_maj').next('a').text(data.nom_auteur.replace('&#8230;','...'));
                $('.zone_art_maj').next('a').attr('title',nom);
                $('.zone_art_maj').next('a').attr('href',lien_auteur);
	           }	           
	        },
            error: function(jqXHR, textStatus, errorThrown) {
	           console.log(jqXHR.responseText+" "+errorThrown);
	        }
    }); 
});

$('#rub_mots').click(function (e){
	e.preventDefault();
	show_loading();
	setTimeout(function(){ hide_loading(); }, 1000);
	var i = $(this).attr('i');
	var m = $('#select_mots').val();
	$url = base_url+'rubriques/enregistrer_mots';
    data = new FormData();
    data.append("i", i);
    data.append("m", m);        
    $.ajax({
           url: $url,
           data: data,
           cache: false,
           contentType: false,
           dataType:'JSON',
           processData: false,
           type: 'POST',
            success: function(data){  
	           if (data.success) {
	           	
	           	$.alert({
                    title: 'Enregistrement des mots-clés',
                    content: 'Les mots-clés ont été correctement ajoutés à la rubrique',
                });
                $('.zone_rub_maj').text(data.date_maj);
                $('.zone_rub_maj').next('a').text(data.nom_auteur.replace('&#8230;','...'));
                $('.zone_rub_maj').next('a').attr('title',nom);
                $('.zone_rub_maj').next('a').attr('href',lien_auteur);
	           }	           
	        },
            error: function(jqXHR, textStatus, errorThrown) {
	           console.log(jqXHR.responseText+" "+errorThrown);
	        }
    }); 
})

$('#art_mots').click(function (e){
	e.preventDefault();
	show_loading();
	setTimeout(function(){ hide_loading(); }, 1000);
	var i = $(this).attr('i');
	var m = $('#select_mots').val();
	$url = base_url+'articles/enregistrer_mots';
    data = new FormData();
    data.append("i", i);
    data.append("m", m);        
    $.ajax({
           url: $url,
           data: data,
           cache: false,
           contentType: false,
           dataType:'JSON',
           processData: false,
           type: 'POST',
            success: function(data){  
	           if (data.success) {
	           	
	           	$.alert({
                    title: 'Enregistrement des mots-clés',
                    content: 'Les mots-clés ont été correctement ajoutés à l\'article',
                });
                $('.zone_art_maj').text(data.date_maj);
                $('.zone_art_maj').next('a').text(data.nom_auteur.replace('&#8230;','...'));
                $('.zone_art_maj').next('a').attr('title',nom);
                $('.zone_art_maj').next('a').attr('href',lien_auteur);
	           }	           
	        },
            error: function(jqXHR, textStatus, errorThrown) {
	           console.log(jqXHR.responseText+" "+errorThrown);
	        }
    }); 
})

$('#doc_mots').click(function (e){
	e.preventDefault();
	show_loading();
	setTimeout(function(){ hide_loading(); }, 1000);
	var i = $(this).attr('i');
	var m = $('#select_mots').val();
	$url = base_url+'documents/enregistrer_mots';
    data = new FormData();
    data.append("i", i);
    data.append("m", m);        
    $.ajax({
           url: $url,
           data: data,
           cache: false,
           contentType: false,
           dataType:'JSON',
           processData: false,
           type: 'POST',
            success: function(data){  
	           if (data.success) {
	           	
	           	$.alert({
                    title: 'Enregistrement des mots-clés',
                    content: 'Les mots-clés ont été correctement ajoutés au document',
                });
                $('.zone_doc_maj').text(data.date_maj);
                $('.zone_doc_maj').next('a').text(data.nom_auteur.replace('&#8230;','...'));
                $('.zone_doc_maj').next('a').attr('title',nom);
                $('.zone_doc_maj').next('a').attr('href',lien_auteur);
	           }	           
	        },
            error: function(jqXHR, textStatus, errorThrown) {
	           console.log(jqXHR.responseText+" "+errorThrown);
	        }
    }); 
})


$('#grp_acces').click(function (e){
	e.preventDefault();
	show_loading();
	setTimeout(function(){ hide_loading(); }, 1000);
	var i = $(this).attr('i');
	var a = $('#select_acces').val();
	//alert(g);return;

	$url = base_url+'groupes/enregistrer_acces';
    data = new FormData();
    data.append("i", i);
    data.append("a", a);        
    $.ajax({
           url: $url,
           data: data,
           cache: false,
           contentType: false,
           dataType:'JSON',
           processData: false,
           type: 'POST',
            success: function(data){  
	           if (data.success) {
	           	
	           	$.alert({
                    title: 'Enregistrement des accès',
                    content: 'Les accès ont été correctement ajoutés à ce groupe',
                });
	           	$('.zone_grp_maj').text(data.date_maj);
                $('.zone_grp_maj').next('a').text(data.nom_auteur.replace('&#8230;','...'));
                $('.zone_grp_maj').next('a').attr('title',nom);
                $('.zone_grp_maj').next('a').attr('href',lien_auteur);

	           }	           
	        },
            error: function(jqXHR, textStatus, errorThrown) {
	           console.log(jqXHR.responseText+" "+errorThrown);
	        }
    }); 
})

$('#aut_groupe').click(function (e){
	e.preventDefault();
	show_loading();
	setTimeout(function(){ hide_loading(); }, 1000);
	var i = $(this).attr('i');
	var g = $('#select_grp_user').val();

	$url = base_url+'utilisateurs/enregistrer_groupes';
    data = new FormData();
    data.append("i", i);
    data.append("g", g);        
    $.ajax({
           url: $url,
           data: data,
           cache: false,
           contentType: false,
           dataType:'JSON',
           processData: false,
           type: 'POST',
            success: function(data){  
	           if (data.success) {
	           	
	           	$.alert({
                    title: 'Enregistrement des groupes',
                    content: 'Les groupes d\'utilisateurs ont été correctement ajoutés à cet utilisateur',
                });
	           }	           
	        },
            error: function(jqXHR, textStatus, errorThrown) {
	           console.log(jqXHR.responseText+" "+errorThrown);
	        }
    }); 
})


$('#save_grp_user').click(function (e){
	e.preventDefault();
	show_loading(s);
	setTimeout(function(){ hide_loading(); }, 1000);
	var i = $(this).attr('i');
	var s = "";
	$('select#search_to option').each(function(i,e){
		s=s+e.attributes.value.nodeValue+",";
	});
	//alert(s); console.log(s);return;

	$url = base_url+'utilisateurs/enregistrer_groupes';
    data = new FormData();
    data.append("i", i);
    data.append("s", s);        
    $.ajax({
           url: $url,
           data: data,
           cache: false,
           contentType: false,
           dataType:'JSON',
           processData: false,
           type: 'POST',
            success: function(data){  
	           if (data.success) {

	           	
	           	$.alert({
                    title: 'Enregistrement des groupes',
                    content: 'Les groupes ont été correctement ajoutés à cet utilisateur',
                });

                $('.zone_aut_maj').text(data.date_maj);
                $('.zone_aut_maj').next('a').text(data.nom_auteur.replace('&#8230;','...'));
                $('.zone_aut_maj').next('a').attr('title',nom);
                $('.zone_aut_maj').next('a').attr('href',lien_auteur);
	           }	           
	        },
            error: function(jqXHR, textStatus, errorThrown) {
	           console.log(jqXHR.responseText+" "+errorThrown);
	        }
    }); 
})


$('#save_grp_users').click(function (e){
	e.preventDefault();
	show_loading(s);
	setTimeout(function(){ hide_loading(); }, 1000);
	var i = $(this).attr('i');
	var s = "";
	$('select#search_to option').each(function(i,e){
		s=s+e.attributes.value.nodeValue+",";
	});
	//alert(s); console.log(s);return;

	$url = base_url+'groupes/enregistrer_users';
    data = new FormData();
    data.append("i", i);
    data.append("s", s);        
    $.ajax({
           url: $url,
           data: data,
           cache: false,
           contentType: false,
           dataType:'JSON',
           processData: false,
           type: 'POST',
            success: function(data){  
	           if (data.success) {

	           	
	           	$.alert({
                    title: 'Enregistrement des utilisateurs',
                    content: 'Les utilisateurs ont été correctement ajoutés à ce groupe',
                });
                $('.zone_grp_maj').text(data.date_maj);
                $('.zone_grp_maj').next('a').text(data.nom_auteur.replace('&#8230;','...'));
                $('.zone_grp_maj').next('a').attr('title',nom);
                $('.zone_grp_maj').next('a').attr('href',lien_auteur);
	           }	           
	        },
            error: function(jqXHR, textStatus, errorThrown) {
	           console.log(jqXHR.responseText+" "+errorThrown);
	        }
    }); 
})

$('#grp_privileges').click(function (e){
	e.preventDefault();
	show_loading();
	setTimeout(function(){ hide_loading(); }, 1000);
	var i = $(this).attr('i');
	var p = $('#select_privileges').val();
	//alert(g);return;

	$url = base_url+'groupes/enregistrer_privileges';
    data = new FormData();
    data.append("i", i);
    data.append("p", p);        
    $.ajax({
           url: $url,
           data: data,
           cache: false,
           contentType: false,
           dataType:'JSON',
           processData: false,
           type: 'POST',
            success: function(data){  
	           if (data.success) {
	           	
	           	$.alert({
                    title: 'Enregistrement des privilèges',
                    content: 'Les privilèges ont été correctement ajoutés à ce groupe',
                });
                $('.zone_grp_maj').text(data.date_maj);
                $('.zone_grp_maj').next('a').text(data.nom_auteur.replace('&#8230;','...'));
                $('.zone_grp_maj').next('a').attr('title',nom);
                $('.zone_grp_maj').next('a').attr('href',lien_auteur);
	           }	           
	        },
            error: function(jqXHR, textStatus, errorThrown) {
	           console.log(jqXHR.responseText+" "+errorThrown);
	        }
    }); 
})








$('.rub_hard_del').click(function (){
	var i = $(this).attr('i');
	var current_row = $(this).closest('tr');
	$.confirm({
	    title: 'Cette opération est irréversible ',
	    content: 'Voulez-vous vraiment supprimer définitivement cette rubrique de la base?',
	    buttons: {
	        confirm: {
	        	text: "OK",
	        	btnClass: 'btn-info',
	        	action : function () {
	        	    sup_rubrique(i,current_row);
	        	}
	        },
	        cancel: {
	        	text: "Annuler",
	        	action : function () {
	        	    //$.alert('Confirmed!');
	        	}
	        }
	    }
	});
})

$('.art_hard_del').click(function (){
	var i = $(this).attr('i');
	var current_row = $(this).closest('tr');
	$.confirm({
	    title: 'Cette opération est irréversible ',
	    content: 'Voulez-vous vraiment supprimer définitivement cet article de la base?',
	    buttons: {
	        confirm: {
	        	text: "OK",
	        	btnClass: 'btn-info',
	        	action : function () {
	        	    sup_article(i,current_row);
	        	}
	        },
	        cancel: {
	        	text: "Annuler",
	        	action : function () {
	        	    //$.alert('Confirmed!');
	        	}
	        }
	    }
	});
})


$('select[name=statut_rub]').change(function(){
	var value = $(this).val();
	if (value=="publie") {
		$('#zone_date_publication').removeClass('hide');
		$('#zone_date_publication').addClass('show');
	}else{
		$('#zone_date_publication').removeClass('show');
		$('#zone_date_publication').addClass('hide');
	}
});

$('select[name=statut_art]').change(function(){
	var value = $(this).val();
	if (value=="publie") {
		$('#zone_date_publication').removeClass('hide');
		$('#zone_date_publication').addClass('show');
	}else{
		$('#zone_date_publication').removeClass('show');
		$('#zone_date_publication').addClass('hide');
	}
});

$('select[name=statut_doc]').change(function(){
	var value = $(this).val();
	if (value=="publie") {
		$('#zone_date_publication').removeClass('hide');
		$('#zone_date_publication').addClass('show');
	}else{
		$('#zone_date_publication').removeClass('show');
		$('#zone_date_publication').addClass('hide');
	}
});


$('#rub_stat').click(function(e){
	e.preventDefault();
	show_loading();
	setTimeout(function(){ hide_loading(); }, 1000);
	var i = $(this).attr('i');
	var s = $('select[name=statut_rub]').val();
	var d = $('input[name=date_pub]').val();
	//alert(ti);return;
	$url = base_url+'rubriques/changer_statut';
    data = new FormData();
    data.append("i", i);
    data.append("s", s);  
    data.append("d", d);        
        $.ajax({
           url: $url,
           data: data,
           cache: false,
           contentType: false,
           dataType:'JSON',
           processData: false,
           type: 'POST',
            success: function(data){  
	           if (data.success) {
	           	$.alert({
                    title: 'Mise à jour du statut',
                    content: 'Le statut de la rubrique a été correctement enregistré',
                });
                $('.zone_rub_maj').text(data.date_maj);
                $('.zone_rub_maj').next('a').text(data.nom_auteur.replace('&#8230;','...'));
                $('.zone_rub_maj').next('a').attr('title',nom);
                $('.zone_rub_maj').next('a').attr('href',lien_auteur);
	           }	           
	        },
            error: function(jqXHR, textStatus, errorThrown) {
	           console.log(jqXHR.responseText+" "+errorThrown);
	        }
        }); 
});

$('#art_stat').click(function(e){
	e.preventDefault();
	show_loading();
	setTimeout(function(){ hide_loading(); }, 1000);
	var i = $(this).attr('i');
	var s = $('select[name=statut_art]').val();
	var d = $('input[name=date_pub]').val();
	//alert(ti);return;
	$url = base_url+'articles/changer_statut';
    data = new FormData();
    data.append("i", i);
    data.append("s", s);  
    data.append("d", d);        
        $.ajax({
           url: $url,
           data: data,
           cache: false,
           contentType: false,
           dataType:'JSON',
           processData: false,
           type: 'POST',
            success: function(data){  
	           if (data.success) {
	           	$.alert({
                    title: 'Mise à jour du statut',
                    content: 'Le statut de l\'article a été correctement enregistré',
                });
                $('.zone_art_maj').text(data.date_maj);
                $('.zone_art_maj').next('a').text(data.nom_auteur.replace('&#8230;','...'));
                $('.zone_art_maj').next('a').attr('title',nom);
                $('.zone_art_maj').next('a').attr('href',lien_auteur);
	           }	           
	        },
            error: function(jqXHR, textStatus, errorThrown) {
	           console.log(jqXHR.responseText+" "+errorThrown);
	        }
        }); 
});

$('#save_lien').click(function(e){
	e.preventDefault();
	show_loading();
	setTimeout(function(){ hide_loading(); }, 1000);
	var o = $(this).attr('o');
	var i = $(this).attr('i');
	var l = $('input[name=inp_lien_url]').val();
	var o_t="";
	if (o=="a") {
		o_t="l'article";
	}else{
		o_t="la rubrique";
	}
	//alert(o_t);return;
	$url = base_url+'articles/enregistrer_url';
    data = new FormData();
    data.append("o", o);
    data.append("l", l); 
    data.append("i", i);        
        $.ajax({
           url: $url,
           data: data,
           cache: false,
           contentType: false,
           dataType:'JSON',
           processData: false,
           type: 'POST',
            success: function(data){  
	           if (data.success) {
	           	$.alert({
                    title: "Modification de l'url de "+o_t,
                    content: "L'url a été correctement enregistré.",
                });
                $('.zone_art_maj').text(data.date_maj);
                $('.zone_art_maj').next('a').text(data.nom_auteur.replace('&#8230;','...'));
                $('.zone_art_maj').next('a').attr('title',nom);
                $('.zone_art_maj').next('a').attr('href',lien_auteur);
	           }	           
	        },
            error: function(jqXHR, textStatus, errorThrown) {
	           console.log(jqXHR.responseText+" "+errorThrown);
	        }
        }); 
});

$('#doc_stat').click(function(e){
	e.preventDefault();
	show_loading();
	setTimeout(function(){ hide_loading(); }, 1000);
	var i = $(this).attr('i');
	var s = $('select[name=statut_doc]').val();
	var d = $('input[name=date_pub]').val();
	//alert(ti);return;
	$url = base_url+'documents/changer_statut';
    data = new FormData();
    data.append("i", i);
    data.append("s", s);  
    data.append("d", d);        
        $.ajax({
           url: $url,
           data: data,
           cache: false,
           contentType: false,
           dataType:'JSON',
           processData: false,
           type: 'POST',
            success: function(data){  
	           if (data.success) {
	           	$.alert({
                    title: 'Mise à jour du statut',
                    content: 'Le statut du document a été correctement enregistré',
                });
                $('.zone_doc_maj').text(data.date_maj);
                $('.zone_doc_maj').next('a').text(data.nom_auteur.replace('&#8230;','...'));
                $('.zone_doc_maj').next('a').attr('title',nom);
                $('.zone_doc_maj').next('a').attr('href',lien_auteur);
	           }	           
	        },
            error: function(jqXHR, textStatus, errorThrown) {
	           console.log(jqXHR.responseText+" "+errorThrown);
	        }
        }); 
});

$('#aut_stat').click(function(e){
	e.preventDefault();
	show_loading();
	setTimeout(function(){ hide_loading(); }, 1000);
	var i = $(this).attr('i');
	var s = $('select[name=statut_aut]').val();
	//alert(ti);return;
	$url = base_url+'utilisateurs/changer_statut';
    data = new FormData();
    data.append("i", i);
    data.append("s", s);        
        $.ajax({
           url: $url,
           data: data,
           cache: false,
           contentType: false,
           dataType:'JSON',
           processData: false,
           type: 'POST',
            success: function(data){  
	           if (data.success) {
	           	$.alert({
                    title: 'Mise à jour du statut',
                    content: 'Le statut de l\'utilisateur a été correctement enregistré',
                });
                
                $('.zone_aut_maj').text(data.date_maj);
                $('.zone_aut_maj').next('a').text(data.nom_auteur.replace('&#8230;','...'));
                $('.zone_aut_maj').next('a').attr('title',nom);
                $('.zone_aut_maj').next('a').attr('href',lien_auteur);
	           }	           
	        },
            error: function(jqXHR, textStatus, errorThrown) {
	           console.log(jqXHR.responseText+" "+errorThrown);
	        }
        }); 
});

$('#rub_add_doc').click(function (e){
	e.preventDefault();
	var internet = $('input[name=image-url]').val();
	var mediatheque = $('input[name=mediaid]').val();
	var titre = $('input[name=doctitre]').val();
	//alert(titre);return;
	var newdoc = $('input[name=newdoc]')[0].files[0];
	var i = $(this).attr('i');
	var opt = "";
	if (internet!="" || newdoc!=null || mediatheque!=null) {
		// si option téleversement local
		if (newdoc!=null) {
			opt = "local";
			addFileRubrique(newdoc,opt,i,titre);
		}
		if(internet!=""){
			// si option téleversement depuis internet
			opt = "internet";
			addFileRubrique(internet,opt,i,titre);
		}

		if(mediatheque!=""){
			// si option téleversement depuis internet
			opt = "mediatheque";
			addFileRubrique(mediatheque,opt,i,titre);
		}		
		//$('.summernote').summernote("insertImage", internet, 'Sans titre');
		$('input[name=doctitre]').val("");
		$('input[name=image-url]').val("");
		//$('#adoc').modal('hide');
		Custombox.modal.close()
		$('input[name=newdoc]').val(null);
		$('input[name=mediaid]').val(null);
		$('#r_doctext').html('&nbsp;')

	}else{
		if (internet=="" && newdoc==null) {
			alert('Veuillez choisir une option en renseignant l\'un des champs depuis votre ordinateur ou internet.');
		}else if(internet==""){
			alert('Veuillez renseigner le lien vers le fichier sur internet SVP.');
		}
		else{
			alert('Veuillez sélectionner un fichier SVP.');
		}
	}
})

$('#art_add_doc').click(function (e){
	e.preventDefault();
	var internet = $('input[name=image-url]').val();
	var mediatheque = $('input[name=mediaid]').val();
	var titre = $('input[name=doctitre]').val();
	//alert(titre);return;
	var newdoc = $('input[name=newdoc]')[0].files[0];
	var i = $(this).attr('i');
	var opt = "";

	if (internet!="" || newdoc!=null || mediatheque!="") {
		if (titre=="" && mediatheque=="") {
			alert('Veuillez entrer le titre du document.');return;
		}
		// si option téleversement local
		if (newdoc!=null) {
			opt = "local";
			addFileArticle(newdoc,opt,i,titre);
		}
		if(internet!=""){
			// si option téleversement depuis internet
			opt = "internet";
			addFileArticle(internet,opt,i,titre);
		}

		if(mediatheque!=""){
			// si option téleversement depuis internet
			opt = "mediatheque";
			addFileArticle(mediatheque,opt,i,titre);
		}		
		//$('.summernote').summernote("insertImage", internet, 'Sans titre');
		$('input[name=doctitre]').val("");
		$('input[name=image-url]').val("");
		//$('#adoc').modal('hide');
		Custombox.modal.close()
		$('input[name=newdoc]').val(null);
		$('input[name=mediaid]').val(null);
		$('#r_doctext').html('&nbsp;')

	}else{
		if (internet=="" && newdoc==null && mediatheque=="") {
			alert('Veuillez choisir une option en renseignant l\'un des champs depuis votre ordinateur ou internet ou depuis la médiathèque.');
		}else if(internet==""){
			alert('Veuillez renseigner le lien vers le fichier sur internet SVP.');
		}
		else if(newdoc==null) {
			alert('Veuillez sélectionner un fichier SVP.');
		}else{
			alert('Veuillez entrer le numéro du document existant.');
		}
	}
	
})

function addFileRubrique(file,opt,i,t) {
	$url = base_url+'rubriques/enregistrer_documents';
    data = new FormData();
    data.append("opt", opt);
    data.append("file", file);
    data.append("t", t);
    data.append("i", i);

	show_loading();
        $.ajax({
           url: $url,
           data: data,
           cache: false,
           contentType: false,
           dataType:'JSON',
           processData: false,
           type: 'POST',
            success: function(data){

				setTimeout(function(){ hide_loading(); }, 1000);
	           if (opt=="internet") {
	           	$('.summernote').summernote("insertImage", data.image_url, 'Sans titre');
	           }else{
	           	$('.summernote').summernote("insertImage", data.image_url, 'filename');
	          }


            	//$('#cnt_doc_rub').html("dddddd")
	         	 $('#cnt_doc_rub').html(data.listeDocuments)
	         	 //alert('zz')
	         	$('.zone_rub_maj').text(data.date_maj);
                $('.zone_rub_maj').next('a').text(data.nom_auteur.replace('&#8230;','...'));
                $('.zone_rub_maj').next('a').attr('title',nom);
                $('.zone_rub_maj').next('a').attr('href',lien_auteur);
	           
	        },
            error: function(jqXHR, textStatus, errorThrown) {
	           console.log(jqXHR.responseText+" "+errorThrown);
	        }
        }); 
}

function addFileArticle(file,opt,i,t) {
	$url = base_url+'articles/enregistrer_documents';
    data = new FormData();
    data.append("opt", opt);
    data.append("file", file);
    data.append("t", t);
    data.append("i", i);

	show_loading();
        $.ajax({
           url: $url,
           data: data,
           cache: false,
           contentType: false,
           dataType:'JSON',
           processData: false,
           type: 'POST',
            success: function(data){

				setTimeout(function(){ hide_loading(); }, 1000);
	           if (opt=="internet") {
	           	$('.summernote').summernote("insertImage", data.image_url, 'Sans titre');
	           }else{
	           	$('.summernote').summernote("insertImage", data.image_url, 'filename');
	          }


            	//$('#cnt_doc_rub').html("dddddd")
	         	 $('#cnt_doc_art').html(data.listeDocuments)
	         	 //alert('zz')
	         	$('.zone_art_maj').text(data.date_maj);
                $('.zone_art_maj').next('a').text(data.nom_auteur.replace('&#8230;','...'));
                $('.zone_art_maj').next('a').attr('title',nom);
                $('.zone_art_maj').next('a').attr('href',lien_auteur);
	           
	        },
            error: function(jqXHR, textStatus, errorThrown) {
	           console.log(jqXHR.responseText+" "+errorThrown);
	        }
        }); 
}



function delete_type_document(i,current_row){
	$url = base_url+'parametrage/types-documents/supprimer';
    data = new FormData();
    data.append("i", i);    
    show_loading();
        $.ajax({
           url: $url,
           data: data,
           cache: false,
           contentType: false,
           dataType:'JSON',
           processData: false,
           type: 'POST',
            success: function(data){

				setTimeout(function(){ hide_loading(); }, 1000);  
	           if (data.success) {	           	
	           	$.alert({
                    title: 'Suppresion',
                    content: 'Le type de document a été correctement supprimé',
                });
                // current_row.remove();

				$('#types_documents_table').dataTable().fnDraw(false);
	           }	           
	        },
            error: function(jqXHR, textStatus, errorThrown) {
	           console.log(jqXHR.responseText+" "+errorThrown);
	        }
        }); 
}


function delete_annee_academique(i,current_row){
	$url = base_url+'parametrage/donnees/academiques/supprimer';
    data = new FormData();
    data.append("i", i);    
    show_loading();
        $.ajax({
           url: $url,
           data: data,
           cache: false,
           contentType: false,
           dataType:'JSON',
           processData: false,
           type: 'POST',
            success: function(data){

				setTimeout(function(){ hide_loading(); }, 1000);  
	           if (data.success) {	           	
	           	$.alert({
                    title: 'Suppresion',
                    content: 'L\'année académique a été correctement supprimée',
                });
                // current_row.remove();

				$('#annees_academiques_table').dataTable().fnDraw(false);
	           }	           
	        },
            error: function(jqXHR, textStatus, errorThrown) {
	           console.log(jqXHR.responseText+" "+errorThrown);
	        }
        }); 
}




function delete_filiere(i,current_row){
	$url = base_url+'parametrage/filieres/supprimer';
    data = new FormData();
    data.append("i", i);    
    show_loading();
        $.ajax({
           url: $url,
           data: data,
           cache: false,
           contentType: false,
           dataType:'JSON',
           processData: false,
           type: 'POST',
            success: function(data){

				setTimeout(function(){ hide_loading(); }, 1000);  
	           if (data.success) {	           	
	           	$.alert({
                    title: 'Suppression',
                    content: 'La filière a été correctement supprimée',
                });
                // current_row.remove();

				$('#filieres_table').dataTable().fnDraw(false);
	           }	           
	        },
            error: function(jqXHR, textStatus, errorThrown) {
	           console.log(jqXHR.responseText+" "+errorThrown);
	        }
        }); 
}
function delete_ressource(i,current_row){
	$url = base_url+'services/professeur/ressources/supprimer';
    data = new FormData();
    data.append("i", i);    
    show_loading();
        $.ajax({
           url: $url,
           data: data,
           cache: false,
           contentType: false,
           dataType:'JSON',
           processData: false,
           type: 'POST',
            success: function(data){

				setTimeout(function(){ hide_loading(); }, 1000);  
	           if (data.success) {	           	
	           	$.alert({
                    title: 'Suppression',
                    content: 'La ressources a été correctement supprimée',
                });
                // current_row.remove();

				$('#professeur_ressources_table').dataTable().fnDraw(false);
	           }	           
	        },
            error: function(jqXHR, textStatus, errorThrown) {
	           console.log(jqXHR.responseText+" "+errorThrown);
	        }
        }); 
}

function delete_donnee_valide(i,current_row){
	$url = base_url+'parametrage/donnees/valides/supprimer';
    data = new FormData();
    data.append("i", i);    
    show_loading();
        $.ajax({
           url: $url,
           data: data,
           cache: false,
           contentType: false,
           dataType:'JSON',
           processData: false,
           type: 'POST',
            success: function(data){

				setTimeout(function(){ hide_loading(); }, 1000);  
	           if (data.success) {	           	
	           	$.alert({
                    title: 'Suppression',
                    content: 'La donnée académique a été correctement supprimée',
                });
                // current_row.remove();

				$('#donnees_valides_table').dataTable().fnDraw(false);
	           }	           
	        },
            error: function(jqXHR, textStatus, errorThrown) {
	           console.log(jqXHR.responseText+" "+errorThrown);
	        }
        }); 
}


function move_rubrique(i,current_row){
	$url = base_url+'rubriques/deplacer_dans_corbeille';
    data = new FormData();
    data.append("i", i);    
    show_loading();
        $.ajax({
           url: $url,
           data: data,
           cache: false,
           contentType: false,
           dataType:'JSON',
           processData: false,
           type: 'POST',
            success: function(data){

				setTimeout(function(){ hide_loading(); }, 1000);  
	           if (data.success) {	           	
	           	$.alert({
                    title: 'Mise en corbeille',
                    content: 'La rubrique a été correctement mise en corbeille',
                });
                current_row.remove();

				$('#rub_table').dataTable().fnDraw(false);
	           }	           
	        },
            error: function(jqXHR, textStatus, errorThrown) {
	           console.log(jqXHR.responseText+" "+errorThrown);
	        }
        }); 
}

function move_article(i,current_row){
	$url = base_url+'articles/deplacer_dans_corbeille';
    data = new FormData();
    data.append("i", i);    
    show_loading();
        $.ajax({
           url: $url,
           data: data,
           cache: false,
           contentType: false,
           dataType:'JSON',
           processData: false,
           type: 'POST',
            success: function(data){

				setTimeout(function(){ hide_loading(); }, 1000);  
	           if (data.success) {	           	
	           	$.alert({
                    title: 'Mise en corbeille',
                    content: 'L\'article a été correctement mis en corbeille',
                });
                current_row.remove();

				$('#art_table').dataTable().fnDraw(false);
	           }	           
	        },
            error: function(jqXHR, textStatus, errorThrown) {
	           console.log(jqXHR.responseText+" "+errorThrown);
	        }
        }); 
}

function move_document(i,current_row){
	$url = base_url+'documents/deplacer_dans_corbeille';
    data = new FormData();
    data.append("i", i);    
    show_loading();
        $.ajax({
           url: $url,
           data: data,
           cache: false,
           contentType: false,
           dataType:'JSON',
           processData: false,
           type: 'POST',
            success: function(data){

				setTimeout(function(){ hide_loading(); }, 1000);  
	           if (data.success) {	           	
	           	$.alert({
                    title: 'Mise en corbeille',
                    content: 'Le document a été correctement mis en corbeille',
                });
                current_row.remove();

	           }	           
	        },
            error: function(jqXHR, textStatus, errorThrown) {
	           console.log(jqXHR.responseText+" "+errorThrown);
	        }
        }); 
}

function move_auteur(i,current_row){
	$url = base_url+'utilisateurs/deplacer_dans_corbeille';
    data = new FormData();
    data.append("i", i);     
    show_loading();  
        $.ajax({
           url: $url,
           data: data,
           cache: false,
           contentType: false,
           dataType:'JSON',
           processData: false,
           type: 'POST',
            success: function(data){
			setTimeout(function(){ hide_loading(); }, 1000);

	           if (data.success) {	           	
	           	$.alert({
                    title: 'Mise en corbeille',
                    content: 'L\'utilisateurs a été correctement mis en corbeille',
                });
                current_row.remove();
	           }	           
	        },
            error: function(jqXHR, textStatus, errorThrown) {
	           console.log(jqXHR.responseText+" "+errorThrown);
	        }
        }); 
}


function sup_rubrique(i,current_row){
	$url = base_url+'rubriques/supprimer';
    data = new FormData();
    data.append("i", i);     
    show_loading();  
        $.ajax({
           url: $url,
           data: data,
           cache: false,
           contentType: false,
           dataType:'JSON',
           processData: false,
           type: 'POST',
            success: function(data){ 
			setTimeout(function(){ hide_loading(); }, 1000); 

	           if (data.success) {	           	
	           	$.alert({
                    title: 'Suppression de la rubrique',
                    content: 'La rubrique a été correctement supprimée de la base',
                });
                current_row.remove();
	           }	           
	        },
            error: function(jqXHR, textStatus, errorThrown) {
	           console.log(jqXHR.responseText+" "+errorThrown);
	        }
        }); 
}

function sup_article(i,current_row){
	$url = base_url+'articles/supprimer';
    data = new FormData();
    data.append("i", i);     
    show_loading();  
        $.ajax({
           url: $url,
           data: data,
           cache: false,
           contentType: false,
           dataType:'JSON',
           processData: false,
           type: 'POST',
            success: function(data){ 
			setTimeout(function(){ hide_loading(); }, 1000); 

	           if (data.success) {	           	
	           	$.alert({
                    title: 'Suppression de l\'article',
                    content: "L'article a été correctement supprimé de la base",
                });
                current_row.remove();
	           }	           
	        },
            error: function(jqXHR, textStatus, errorThrown) {
	           console.log(jqXHR.responseText+" "+errorThrown);
	        }
        }); 
}

function sup_groupe(i,current_row){
	$url = base_url+'groupes/supprimer';
    data = new FormData();
    data.append("i", i);       
        $.ajax({
           url: $url,
           data: data,
           cache: false,
           contentType: false,
           dataType:'JSON',
           processData: false,
           type: 'POST',
            success: function(data){  
	           if (data.success) {	           	
	           	$.alert({
                    title: 'Suppression du groupe',
                    content: 'Le groupe a été correctement supprimé de la base',
                });
                current_row.remove();
	           }	           
	        },
            error: function(jqXHR, textStatus, errorThrown) {
	           console.log(jqXHR.responseText+" "+errorThrown);
	        }
        }); 
}


function sup_mot(i,current_row){
	$url = base_url+'mots/supprimer';
    data = new FormData();
    data.append("i", i);       
        $.ajax({
           url: $url,
           data: data,
           cache: false,
           contentType: false,
           dataType:'JSON',
           processData: false,
           type: 'POST',
            success: function(data){  
	           if (data.success) {	           	
	           	$.alert({
                    title: 'Suppression du mot-clé',
                    content: 'Le mot-clé a été correctement supprimé de la base',
                });
                current_row.remove();

                $('#mot_table').dataTable().fnDraw('false');
	           }	           
	        },
            error: function(jqXHR, textStatus, errorThrown) {
	           console.log(jqXHR.responseText+" "+errorThrown);
	        }
        }); 
}

function show_loading(){
	$('#loading_gif').removeClass("hidden");
	$('#loading_gif').addClass("show");
}

function hide_loading(){
	$('#loading_gif').removeClass("show");
	$('#loading_gif').addClass("hidden");
}




/* Summernote modal */

$(document).ready(function(){
	$('div[aria-label="Insert Image"] .modal-header h4').addClass('hidden');
	$('div[aria-label="Insert Image"] .modal-header button').text('x Fermer');
	$('div[aria-label="Insert Image"] .note-group-select-from-files label').text('Depuis cet ordinateur');
	$('div[aria-label="Insert Image"] .note-group-image-url label').text('Lien en ligne');
	$('div[aria-label="Insert Image"] .note-image-btn').text('Insérer');
	$('.note-insert button[aria-label="Video"]').addClass('hidden');
	$('.note-link-text').closest('.form-group').find('label').text('Texte à afficher');
	$('.note-link-url').closest('.form-group').find('label').text('Sur quelle adresse internet pointer le lien?');

	$('#sn-checkbox-open-in-new-window').closest('.checkbox').removeClass('checkbox');
	$('.note-link-btn').text('Insérer le lien')
	$('.link-dialog').find('.modal-title').text('Fermer');
	$('.link-dialog').find('.close').css('font-size','30px');
	$('.link-dialog').find('.close').css('padding','0');
	$('.link-dialog').find('.close').css('padding-right','20px');
	$('label[for=sn-checkbox-open-in-new-window]').html('<input role="checkbox" id="sn-checkbox-open-in-new-window" checked="" aria-checked="true" type="checkbox"> Ouvrir dans un nouvel onglet')
	
	var publie_url = base_url_asset+'/publie.png'
	//<span style="background:#ddd; border: 1px solid #000;height: 10px;width: 10px !important;display: inline-block;"></span>
	//$('select[name=statut_rub] option[value=0]').html('<span style="background:#ddd; border: 1px solid #000;height: 10px;width: 10px !important;display: inline-block;"></span>');
	//$('select[name=statut_rub] option[value=0]').css('background-image','url('+publie_url+')');
	//$('select[name=statut_rub] option[value=0]').css('border','1px solid #000');
	//$('select[name=statut_rub] option[value=1]').css('border','1px solid #9DBA00');
	
})

$('input[name=mediaid]').keyup(function(e){
	e.preventDefault();
	show_loading();
	setTimeout(function(){ hide_loading(); }, 1000);
	var i=$(this).val()
	var io = $(this).closest('.form-group').find('input[name=io]').val();
	var o = $(this).closest('.form-group').find('input[name=o]').val();
	//alert(o);return;
	$url = base_url+'documents/existe';
	data = new FormData();
	data.append("i", i);   
	data.append("io", io);
	data.append("o", o);     
	$.ajax({
		url: $url,
		data: data,
		cache: false,
		contentType: false,
		dataType:'JSON',
		processData: false,
		type: 'POST',
		success: function(data){ 
			if (data.success) {
					$('#r_doctext').attr('class','g-color-main');
					$('#r_doctext').text(data.result);
					$('#rub_add_doc').removeAttr('disabled')
				}else{
					$('#r_doctext').attr('class','g-color-red');
					$('#r_doctext').text(data.result);
					$('#rub_add_doc').attr('disabled','');
			}	

			if (i=="") {//$('#r_doctext').addClass('hide')
				$('#r_doctext').html('&nbsp');
				$('#rub_add_doc').removeAttr('disabled')
			};

		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log(jqXHR.responseText+" "+errorThrown);
		}
	}); 
})

$('.copier_texte').click(function (){
		/*var el = document.getElementById('obj_url');
		var range = document.createRange();
		range.selectNodeContents(el);
		var sel = window.getSelection();
		sel.removeAllRanges();
		sel.addRange(range);
		document.execCommand('copy');
		alert("Contents copied to clipboard.");
		return false;*/
	$("#obj_url").focus();
	$("#obj_url").select();
    document.execCommand("Copy");
    $.alert('L\'adresse Url publique de l\'objet a été copiée!');
    //alert(copyText)
	//copyToClipboard($(this).closest('.pull-right').find('input[name=obj_url]'))
	//copyToClipboard();
	
});

function copyToClipboard() {
    //element.select();
    var copyText = document.getElementById("obj_url");
  	copyText.select();
    document.execCommand("Copy");
    alert(copyText)
}

$(document).on('click','.r_doc',function(){	
	nb_doc = $("input:checkbox[class=r_doc]:checked").length;
	$('#bdc_text').text(nb_doc)
})
$('#btn_doc_corbeille').on('click',function(e){
	e.preventDefault();
	if ($("input:checkbox[class=r_doc]:checked").length==0) {
		$.alert('Aucun document coché. Veuillez cocher au moins un document d\'abord');return;
	}
	var d ="";
	$("input:checkbox[class=r_doc]:checked").each(function(){
		d=d+$(this).attr('i')+';';
	});
	$url = base_url+'documents/deplacer_dans_corbeille';
    data = new FormData();
    data.append("ii", d);
    $.confirm({
	    title: 'Confirmer la mise en corbeille',
	    content: 'Les documents cochés seront mis en corbeille',
	    buttons: {
	        confirm: {
	        	text: "Oui",
	        	btnClass: 'btn-info',
	        	action : function () {
	        	    $.ajax({
			           url: $url,
			           data: data,
			           cache: false,
			           contentType: false,
			           dataType:'JSON',
			           processData: false,
			           type: 'POST',
			            success: function(data){
				           //console.log(data);
				           if (data.success) {
					           	$("input:checkbox[class=r_doc]:checked").each(function(){
								   $(this).closest('.items').remove();
								});
								nb_doc = $("input:checkbox[class=r_doc]:checked").length;
								$('#bdc_text').text(nb_doc)
								$.alert('Les documents ont été supprimés');
								location.reload;
				           };
				           
				           
				        },
			            error: function(jqXHR, textStatus, errorThrown) {
				           console.log(jqXHR.responseText+" "+errorThrown);
				        }
			        }); 
	        	}
	        },
	        cancel: {
	        	text: "Non",
	        	action : function () {
	        	    //$.alert('Confirmed!');
	        	}
	        }
	    }
	});
});

$('.doc_del').on('click',function(e){
	e.preventDefault();
                    	//alert('nf');return;
						var i = $(this).attr('i');
						var current_row = $(this).closest('.items');
						$.confirm({
						    title: 'Confirmer la mise en corbeille',
						    content: 'Ce document sera mis en corbeille',
						    buttons: {
						        confirm: {
						        	text: "OK",
						        	btnClass: 'btn-info',
						        	action : function () {
						        	    move_document(i,current_row);
						        	}
						        },
						        cancel: {
						        	text: "Annuler",
						        	action : function () {
						        	    //$.alert('Confirmed!');
						        	}
						        }
						    }
						});
});


$('#mes_editions_table').dataTable( {
            fnDrawCallback: function(settings, json) {
                    $.HSCore.components.HSDropdown.init($('[data-dropdown-target]'), {
                      dropdownHideOnScroll: false,
                      dropdownType: 'css-animation',
                      dropdownAnimationIn: 'fadeIn',
                      dropdownAnimationOut: 'fadeOut'
                    });


					$('.lien_statut').click(function (e){
						
						e.preventDefault();
						var i = $(this).attr('i');
						var d = "";
						var s = $(this).attr('v');
						var statut_ui = $(this).closest('.d-inline-block').find('a.toggle');
						$.confirm({
						    title: 'Mise à jour du statut',
						    content: 'Confirmez-vous ce changement de statut?',
						    buttons: {
						        confirm: {
						        	text: "Oui",
						        	btnClass: 'btn-info',
						        	action : function () {
										show_loading();
										setTimeout(function(){ hide_loading(); }, 1000);
										//alert(ti);return;
										$url = base_url+'articles/changer_statut';
									    data = new FormData();
									    data.append("i", i);
									    data.append("s", s);  
									    data.append("d", d);        
									        $.ajax({
									           url: $url,
									           data: data,
									           cache: false,
									           contentType: false,
									           dataType:'JSON',
									           processData: false,
									           type: 'POST',
									            success: function(data){  
										           if (data.success) {
										           	$.alert({
									                    title: 'Mise à jour du statut',
									                    content: 'Le statut de l\'article a été correctement enregistré',
									                });
									                //update ui statut
									                $('#menu-toggle'+data.i).attr('style',data.statut)
									                $('#menu-toggle'+data.i).attr('title',data.t)

									                $('#mes_editions_table').dataTable().fnDraw(false)
										           }	           
										        },
									            error: function(jqXHR, textStatus, errorThrown) {
										           console.log(jqXHR.responseText+" "+errorThrown);
										        }
									        }); 
						        	}
						        },
						        cancel: {
						        	text: "Non",
						        	action : function () {
						        	    //$.alert('Confirmed!');
						        	}
						        }
						    }
						});
					})

					$('.lien_statut_pub').click(function (e){
						e.preventDefault();
						var i = $(this).attr('i');
						var d = $(this).prev('input[type=date]').val();
						var s = $(this).attr('v');
						var statut_ui = $(this).closest('.d-inline-block').find('a.toggle');
						//console.log(statut_ui);return;
						//alert("i:"+i+"//v:"+s+"//d:"+d);return;
						$.confirm({
						    title: 'Mise à jour du statut',
						    content: 'Confirmez-vous la publication de cet article?',
						    buttons: {
						        confirm: {
						        	text: "Oui",
						        	btnClass: 'btn-info',
						        	action : function () {
						        	    //move_rubrique(i,current_row);
						        	    e.preventDefault();
										show_loading();
										setTimeout(function(){ hide_loading(); }, 1000);
										//alert(ti);return;
										$url = base_url+'articles/changer_statut';
									    data = new FormData();
									    data.append("i", i);
									    data.append("s", s);  
									    data.append("d", d);        
									        $.ajax({
									           url: $url,
									           data: data,
									           cache: false,
									           contentType: false,
									           dataType:'JSON',
									           processData: false,
									           type: 'POST',
									            success: function(data){  
										           if (data.success) {
										           	$.alert({
									                    title: 'Mise à jour du statut',
									                    content: 'Le statut de l\'article a été correctement enregistré',
									                });
									                //update ui statut
									                $('#menu-toggle'+data.i).attr('style',data.statut)
									                $('#menu-toggle'+data.i).attr('title',data.t)
									                //statut_ui.html(data.statut)

									                $('#mes_editions_table').dataTable().fnDraw(false)
										           }	           
										        },
									            error: function(jqXHR, textStatus, errorThrown) {
										           console.log(jqXHR.responseText+" "+errorThrown);
										        }
									        }); 
						        	}
						        },
						        cancel: {
						        	text: "Non",
						        	action : function () {
						        	    //$.alert('Confirmed!');
						        	}
						        }
						    }
						});
					})

                    $('[data-menu]').menu();


                    //alert( 'DataTables has finished its initialisation.' );
                  },
            processing:true,  
              serverSide:true,
              ajax:{  
                      url: base_url+"/dashboard/parcourir_mes_editions",  
                      type:"POST"  ,
                      dataSrc:function(j){
                        //console.log(j);
                       return j.data;
                      },
                      mRender: function (data, type, ab) {
                        if (ab == null) {
                             return ''; 
                        }
                      },

            },
            createdRow: function(row, data, index) {
                $('td', row).eq(0).addClass('js-select text-left g-first-child'); // 6 is index of column
			},
            aaSorting: [[ 0, "asc" ]],
            lengthMenu: [[10, 20, -1], [10, 20, "Tout"]],
            pageLength: 8,
            iDisplayLength:25,
            language: {
             "searchPlaceholder": "Recherche",
             "sProcessing":     "Recherche en cours...",
              "sSearch":         "",
              "sLengthMenu":     "",
              "sInfo":           "",
              "sInfoEmpty":      "",
              "sInfoFiltered":   "(filtr&eacute; de _MAX_ &eacute;l&eacute;ments au total)",
              "sInfoPostFix":    "",
              "sLoadingRecords": "Chargement en cours...",
              "sZeroRecords":    "Aucun &eacute;l&eacute;ment &agrave; afficher",
              "sEmptyTable":     "Aucune donn&eacute;e disponible dans le tableau",
              "oPaginate": {            
                "sFirst":      "Premier",
                "sPrevious":   "<i class='hs-admin-angle-left'><i>",
                "sNext":       "<i class='hs-admin-angle-right'><i>",
                "sLast":       "Dernier"
              },
              "oAria": {
                "sSortAscending":  ": activer pour trier la colonne par ordre croissant",
                "sSortDescending": ": activer pour trier la colonne par ordre d&eacute;croissant"
              }
            },
            /*sDom:"<'form-control g-font-size-default g-brd-gray-dark-v7 g-brd-darkblue-v3--focus g-rounded-20 g-pl-20 g-pr-50 g-py-10'>lr",*/
            /**/dom: "<'row'<'col-sm-4'l><'col-sm-4 text-center'B><'col-sm-4'f>>tp",
            "lengthMenu": [ [10, 25, 50, -1], [10, 25, 50, "Tout"] ],
            buttons: [
                {extend: 'copy',className: 'btn-sm',text:'<i class="fa fa-copy"></i> Copier'},
                {extend: 'csv',title: 'PADME WEB CONSOLE - Liste des articles', className: 'btn-sm',text:'<i class="fa fa-file-excel-o"></i> CSV'},
                {extend: 'pdf', title: 'PADME WEB CONSOLE - Liste des articles', className: 'btn-sm',text:'<i class="fa fa-file-pdf-o"></i> PDF'},
                {extend: 'print', title: 'PADME WEB CONSOLE - Liste des articles',className: 'btn-sm',text:'<i class="fa fa-print"></i> Imprimer'}
            ]
});

$('#derniers_art_table').dataTable( {
            fnDrawCallback: function(settings, json) {
                    $.HSCore.components.HSDropdown.init($('[data-dropdown-target]'), {
                      dropdownHideOnScroll: false,
                      dropdownType: 'css-animation',
                      dropdownAnimationIn: 'fadeIn',
                      dropdownAnimationOut: 'fadeOut'
                    });


					$('.lien_statut').click(function (e){
						
						e.preventDefault();
						var i = $(this).attr('i');
						var d = "";
						var s = $(this).attr('v');
						var statut_ui = $(this).closest('.d-inline-block').find('a.toggle');
						$.confirm({
						    title: 'Mise à jour du statut',
						    content: 'Confirmez-vous ce changement de statut?',
						    buttons: {
						        confirm: {
						        	text: "Oui",
						        	btnClass: 'btn-info',
						        	action : function () {
										show_loading();
										setTimeout(function(){ hide_loading(); }, 1000);
										//alert(ti);return;
										$url = base_url+'articles/changer_statut';
									    data = new FormData();
									    data.append("i", i);
									    data.append("s", s);  
									    data.append("d", d);        
									        $.ajax({
									           url: $url,
									           data: data,
									           cache: false,
									           contentType: false,
									           dataType:'JSON',
									           processData: false,
									           type: 'POST',
									            success: function(data){  
										           if (data.success) {
										           	$.alert({
									                    title: 'Mise à jour du statut',
									                    content: 'Le statut de l\'article a été correctement enregistré',
									                });
									                //update ui statut
									                $('#menu-toggle'+data.i).attr('style',data.statut)
									                $('#menu-toggle'+data.i).attr('title',data.t)

									                $('#derniers_art_table').dataTable().fnDraw(false)
										           }	           
										        },
									            error: function(jqXHR, textStatus, errorThrown) {
										           console.log(jqXHR.responseText+" "+errorThrown);
										        }
									        }); 
						        	}
						        },
						        cancel: {
						        	text: "Non",
						        	action : function () {
						        	    //$.alert('Confirmed!');
						        	}
						        }
						    }
						});
					})

					$('.lien_statut_pub').click(function (e){
						e.preventDefault();
						var i = $(this).attr('i');
						var d = $(this).prev('input[type=date]').val();
						var s = $(this).attr('v');
						var statut_ui = $(this).closest('.d-inline-block').find('a.toggle');
						//console.log(statut_ui);return;
						//alert("i:"+i+"//v:"+s+"//d:"+d);return;
						$.confirm({
						    title: 'Mise à jour du statut',
						    content: 'Confirmez-vous la publication de cet article?',
						    buttons: {
						        confirm: {
						        	text: "Oui",
						        	btnClass: 'btn-info',
						        	action : function () {
						        	    //move_rubrique(i,current_row);
						        	    e.preventDefault();
										show_loading();
										setTimeout(function(){ hide_loading(); }, 1000);
										//alert(ti);return;
										$url = base_url+'articles/changer_statut';
									    data = new FormData();
									    data.append("i", i);
									    data.append("s", s);  
									    data.append("d", d);        
									        $.ajax({
									           url: $url,
									           data: data,
									           cache: false,
									           contentType: false,
									           dataType:'JSON',
									           processData: false,
									           type: 'POST',
									            success: function(data){  
										           if (data.success) {
										           	$.alert({
									                    title: 'Mise à jour du statut',
									                    content: 'Le statut de l\'article a été correctement enregistré',
									                });
									                //update ui statut
									                $('#menu-toggle'+data.i).attr('style',data.statut)
									                $('#menu-toggle'+data.i).attr('title',data.t)
									                //statut_ui.html(data.statut)

									                $('#derniers_art_table').dataTable().fnDraw(false)
										           }	           
										        },
									            error: function(jqXHR, textStatus, errorThrown) {
										           console.log(jqXHR.responseText+" "+errorThrown);
										        }
									        }); 
						        	}
						        },
						        cancel: {
						        	text: "Non",
						        	action : function () {
						        	    //$.alert('Confirmed!');
						        	}
						        }
						    }
						});
					})

                    $('[data-menu]').menu();


                    //alert( 'DataTables has finished its initialisation.' );
                  },
            processing:true,  
              serverSide:true,
              ajax:{  
                      url: base_url+"/dashboard/parcourir_derniers",  
                      type:"POST"  ,
                      dataSrc:function(j){
                        //console.log(j);
                       return j.data;
                      },
                      mRender: function (data, type, ab) {
                        if (ab == null) {
                             return ''; 
                        }
                      },

            },
            createdRow: function(row, data, index) {
                $('td', row).eq(0).addClass('js-select text-left g-first-child'); // 6 is index of column
			},
            aaSorting: [],
            lengthMenu: [[10, 20, -1], [10, 20, "Tout"]],
            pageLength: 8,
            iDisplayLength:25,
            language: {
             "searchPlaceholder": "Recherche",
             "sProcessing":     "Recherche en cours...",
              "sSearch":         "",
              "sLengthMenu":     "",
              "sInfo":           "",
              "sInfoEmpty":      "",
              "sInfoFiltered":   "(filtr&eacute; de _MAX_ &eacute;l&eacute;ments au total)",
              "sInfoPostFix":    "",
              "sLoadingRecords": "Chargement en cours...",
              "sZeroRecords":    "Aucun &eacute;l&eacute;ment &agrave; afficher",
              "sEmptyTable":     "Aucune donn&eacute;e disponible dans le tableau",
              "oPaginate": {            
                "sFirst":      "Premier",
                "sPrevious":   "<i class='hs-admin-angle-left'><i>",
                "sNext":       "<i class='hs-admin-angle-right'><i>",
                "sLast":       "Dernier"
              },
              "oAria": {
                "sSortAscending":  ": activer pour trier la colonne par ordre croissant",
                "sSortDescending": ": activer pour trier la colonne par ordre d&eacute;croissant"
              }
            },
            /*sDom:"<'form-control g-font-size-default g-brd-gray-dark-v7 g-brd-darkblue-v3--focus g-rounded-20 g-pl-20 g-pr-50 g-py-10'>lr",*/
            /**/dom: "<'row'<'col-sm-4'l><'col-sm-4 text-center'B><'col-sm-4'f>>tp",
            "lengthMenu": [ [10, 25, 50, -1], [10, 25, 50, "Tout"] ],
            buttons: [
                {extend: 'copy',className: 'btn-sm',text:'<i class="fa fa-copy"></i> Copier'},
                {extend: 'csv',title: 'PADME WEB CONSOLE - Liste des articles', className: 'btn-sm',text:'<i class="fa fa-file-excel-o"></i> CSV'},
                {extend: 'pdf', title: 'PADME WEB CONSOLE - Liste des articles', className: 'btn-sm',text:'<i class="fa fa-file-pdf-o"></i> PDF'},
                {extend: 'print', title: 'PADME WEB CONSOLE - Liste des articles',className: 'btn-sm',text:'<i class="fa fa-print"></i> Imprimer'}
            ]
});

$('#documents_table').dataTable( {
            fnDrawCallback: function(settings, json) {
                    

                    //alert( 'DataTables has finished its initialisation.' );
                  },
            processing:true,  
              serverSide:true,
              ajax:{  
                      url: base_url+"/dashboard/parcourir_documents",  
                      type:"POST"  ,
                      dataSrc:function(j){
                        //console.log(j);
                       return j.data;
                      },
                      mRender: function (data, type, ab) {
                        if (ab == null) {
                             return ''; 
                        }
                      },

            },
            createdRow: function(row, data, index) {
                $('td', row).eq(0).addClass('js-select text-left g-first-child'); // 6 is index of column
			},
            aaSorting: [],
            lengthMenu: [[10, 20, -1], [10, 20, "Tout"]],
            pageLength: 8,
            iDisplayLength:25,
            language: {
             "searchPlaceholder": "Recherche",
             "sProcessing":     "Recherche en cours...",
              "sSearch":         "",
              "sLengthMenu":     "",
              "sInfo":           "",
              "sInfoEmpty":      "",
              "sInfoFiltered":   "(filtr&eacute; de _MAX_ &eacute;l&eacute;ments au total)",
              "sInfoPostFix":    "",
              "sLoadingRecords": "Chargement en cours...",
              "sZeroRecords":    "Aucun &eacute;l&eacute;ment &agrave; afficher",
              "sEmptyTable":     "Aucune donn&eacute;e disponible dans le tableau",
              "oPaginate": {            
                "sFirst":      "Premier",
                "sPrevious":   "<i class='hs-admin-angle-left'><i>",
                "sNext":       "<i class='hs-admin-angle-right'><i>",
                "sLast":       "Dernier"
              },
              "oAria": {
                "sSortAscending":  ": activer pour trier la colonne par ordre croissant",
                "sSortDescending": ": activer pour trier la colonne par ordre d&eacute;croissant"
              }
            },
            /*sDom:"<'form-control g-font-size-default g-brd-gray-dark-v7 g-brd-darkblue-v3--focus g-rounded-20 g-pl-20 g-pr-50 g-py-10'>lr",*/
            /**/dom: "<'row'<'col-sm-4'l><'col-sm-4 text-center'B><'col-sm-4'f>>tp",
            "lengthMenu": [ [10, 25, 50, -1], [10, 25, 50, "Tout"] ],
            buttons: [
                {extend: 'copy',className: 'btn-sm',text:'<i class="fa fa-copy"></i> Copier'},
                {extend: 'csv',title: 'PADME WEB CONSOLE - Liste des articles', className: 'btn-sm',text:'<i class="fa fa-file-excel-o"></i> CSV'},
                {extend: 'pdf', title: 'PADME WEB CONSOLE - Liste des articles', className: 'btn-sm',text:'<i class="fa fa-file-pdf-o"></i> PDF'},
                {extend: 'print', title: 'PADME WEB CONSOLE - Liste des articles',className: 'btn-sm',text:'<i class="fa fa-print"></i> Imprimer'}
            ]
});

$('#rub_table').dataTable( {
            fnDrawCallback: function(settings, json) {
                    $.HSCore.components.HSDropdown.init($('[data-dropdown-target]'), {
                      dropdownHideOnScroll: false,
                      dropdownType: 'css-animation',
                      dropdownAnimationIn: 'fadeIn',
                      dropdownAnimationOut: 'fadeOut'
                    });

                    $('.rub_del').on('click', function (){
						var i = $(this).attr('i');
						var current_row = $(this).closest('tr');
						$.confirm({
						    title: 'Confirmer la mise en corbeille',
						    content: 'Cette rubrique sera mise en corbeille',
						    buttons: {
						        confirm: {
						        	text: "OK",
						        	btnClass: 'btn-info',
						        	action : function () {
						        	    move_rubrique(i,current_row);
						        	}
						        },
						        cancel: {
						        	text: "Annuler",
						        	action : function () {
						        	    //$.alert('Confirmed!');
						        	}
						        }
						    }
						});
					});

					$('.lien_statut').click(function (e){
						
						e.preventDefault();
						var i = $(this).attr('i');
						var d = "";
						var s = $(this).attr('v');
						var statut_ui = $(this).closest('.d-inline-block').find('a.toggle');
						$.confirm({
						    title: 'Mise à jour du statut',
						    content: 'Confirmez-vous ce changement de statut?',
						    buttons: {
						        confirm: {
						        	text: "Oui",
						        	btnClass: 'btn-info',
						        	action : function () {
										show_loading();
										setTimeout(function(){ hide_loading(); }, 1000);
										//alert(ti);return;
										$url = base_url+'rubriques/changer_statut';
									    data = new FormData();
									    data.append("i", i);
									    data.append("s", s);  
									    data.append("d", d);        
									        $.ajax({
									           url: $url,
									           data: data,
									           cache: false,
									           contentType: false,
									           dataType:'JSON',
									           processData: false,
									           type: 'POST',
									            success: function(data){  
										           if (data.success) {
										           	$.alert({
									                    title: 'Mise à jour du statut',
									                    content: 'Le statut de la rubrique a été correctement enregistré',
									                });
									                //update ui statut
									                $('#menu-toggle'+data.i).attr('style',data.statut)
									                $('#menu-toggle'+data.i).attr('title',data.t)

									                $('#rub_table').dataTable().fnDraw(false)
										           }	           
										        },
									            error: function(jqXHR, textStatus, errorThrown) {
										           console.log(jqXHR.responseText+" "+errorThrown);
										        }
									        }); 
						        	}
						        },
						        cancel: {
						        	text: "Non",
						        	action : function () {
						        	    //$.alert('Confirmed!');
						        	}
						        }
						    }
						});
					})

					$('.lien_statut_pub').click(function (e){
						e.preventDefault();
						var i = $(this).attr('i');
						var d = $(this).prev('input[type=date]').val();
						var s = $(this).attr('v');
						var statut_ui = $(this).closest('.d-inline-block').find('a.toggle');
						//console.log(statut_ui);return;
						//alert("i:"+i+"//v:"+s+"//d:"+d);return;
						$.confirm({
						    title: 'Mise à jour du statut',
						    content: 'Confirmez-vous la publication de cette rubrique?',
						    buttons: {
						        confirm: {
						        	text: "Oui",
						        	btnClass: 'btn-info',
						        	action : function () {
						        	    //move_rubrique(i,current_row);
						        	    e.preventDefault();
										show_loading();
										setTimeout(function(){ hide_loading(); }, 1000);
										//alert(ti);return;
										$url = base_url+'rubriques/changer_statut';
									    data = new FormData();
									    data.append("i", i);
									    data.append("s", s);  
									    data.append("d", d);        
									        $.ajax({
									           url: $url,
									           data: data,
									           cache: false,
									           contentType: false,
									           dataType:'JSON',
									           processData: false,
									           type: 'POST',
									            success: function(data){  
										           if (data.success) {
										           	$.alert({
									                    title: 'Mise à jour du statut',
									                    content: 'Le statut de la rubrique a été correctement enregistré',
									                });
									                //update ui statut
									                $('#menu-toggle'+data.i).attr('style',data.statut)
									                $('#menu-toggle'+data.i).attr('title',data.t)
									                //statut_ui.html(data.statut)

									                $('#rub_table').dataTable().fnDraw(false)
										           }	           
										        },
									            error: function(jqXHR, textStatus, errorThrown) {
										           console.log(jqXHR.responseText+" "+errorThrown);
										        }
									        }); 
						        	}
						        },
						        cancel: {
						        	text: "Non",
						        	action : function () {
						        	    //$.alert('Confirmed!');
						        	}
						        }
						    }
						});
					})

                    $('[data-menu]').menu();


                    //alert( 'DataTables has finished its initialisation.' );
                  },
            processing:true,  
              serverSide:true,
              ajax:{  
                      url: base_url+"/rubriques/parcourir",  
                      type:"POST"  ,
                      dataSrc:function(j){
                      	console.log(j)
                        $('.nbtable').html(j.recordsFiltered);
                       return j.data;
                      },
                      mRender: function (data, type, ab) {
                        if (ab == null) {
                             return ''; 
                        }
                      },

            },
            createdRow: function(row, data, index) {
                $('td', row).eq(0).addClass('js-select text-left g-first-child'); // 6 is index of column
			},
            aaSorting: [[ 0, "desc" ]],
            lengthMenu: [[10, 20, -1], [10, 20, "Tout"]],
            pageLength: 8,
            iDisplayLength:25,
            language: {
             "searchPlaceholder": "Recherche",
             "sProcessing":     "Recherche en cours...",
              "sSearch":         "",
              "sLengthMenu":     "Afficher _MENU_ &eacute;l&eacute;ments &nbsp;&nbsp;&nbsp;",
              "sInfo":           "_TOTAL_ élément(s) au total  ",
              "sInfoEmpty":      "Affichage de l'&eacute;l&eacute;ment 0 &agrave; 0 sur 0 &eacute;l&eacute;ment",
              "sInfoFiltered":   "(filtr&eacute; de _MAX_ &eacute;l&eacute;ments au total)",
              "sInfoPostFix":    "",
              "sLoadingRecords": "Chargement en cours...",
              "sZeroRecords":    "Aucun &eacute;l&eacute;ment &agrave; afficher",
              "sEmptyTable":     "Aucune donn&eacute;e disponible dans le tableau",
              "oPaginate": {            
                "sFirst":      "Premier",
                "sPrevious":   "<i class='hs-admin-angle-left'><i>",
                "sNext":       "<i class='hs-admin-angle-right'><i>",
                "sLast":       "Dernier"
              },
              "oAria": {
                "sSortAscending":  ": activer pour trier la colonne par ordre croissant",
                "sSortDescending": ": activer pour trier la colonne par ordre d&eacute;croissant"
              }
            },
            /*sDom:"<'form-control g-font-size-default g-brd-gray-dark-v7 g-brd-darkblue-v3--focus g-rounded-20 g-pl-20 g-pr-50 g-py-10'>lr",*/
            dom: "<'row'<'col-sm-4'l><'col-sm-4 text-center'B><'col-sm-4'f>>tp",
            "lengthMenu": [ [10, 25, 50, -1], [10, 25, 50, "Tout"] ],
            buttons: [
                {extend: 'copy',className: 'btn-sm',text:'<i class="fa fa-copy"></i> Copier',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'csv',title: 'PADME WEB CONSOLE - Liste des rubriques', className: 'btn-sm',text:'<i class="fa fa-file-excel-o"></i> CSV',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'pdf', title: 'PADME WEB CONSOLE - Liste des rubriques', className: 'btn-sm',text:'<i class="fa fa-file-pdf-o"></i> PDF',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'print', title: 'PADME WEB CONSOLE - Liste des rubriques',className: 'btn-sm',text:'<i class="fa fa-print"></i> Imprimer',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	}
            ]
});




$('#corb_rub_table').dataTable( {
            fnDrawCallback: function(settings, json) {
                    $.HSCore.components.HSDropdown.init($('[data-dropdown-target]'), {
                      dropdownHideOnScroll: false,
                      dropdownType: 'css-animation',
                      dropdownAnimationIn: 'fadeIn',
                      dropdownAnimationOut: 'fadeOut'
                    });

                    $('.rub_hard_del').click(function (){
						var i = $(this).attr('i');
						var current_row = $(this).closest('tr');
						$.confirm({
						    title: 'Cette opération est irréversible ',
						    content: 'Voulez-vous vraiment supprimer définitivement cette rubrique de la base?',
						    buttons: {
						        confirm: {
						        	text: "OK",
						        	btnClass: 'btn-info',
						        	action : function () {
						        	    sup_rubrique(i,current_row);
						        	}
						        },
						        cancel: {
						        	text: "Annuler",
						        	action : function () {
						        	    //$.alert('Confirmed!');
						        	}
						        }
						    }
						});
					})

					$('.lien_statut').click(function (e){
						
						e.preventDefault();
						var i = $(this).attr('i');
						var d = "";
						var s = $(this).attr('v');
						var statut_ui = $(this).closest('.d-inline-block').find('a.toggle');
						$.confirm({
						    title: 'Mise à jour du statut',
						    content: 'Confirmez-vous ce changement de statut?',
						    buttons: {
						        confirm: {
						        	text: "Oui",
						        	btnClass: 'btn-info',
						        	action : function () {
										show_loading();
										setTimeout(function(){ hide_loading(); }, 1000);
										//alert(ti);return;
										$url = base_url+'rubriques/changer_statut';
									    data = new FormData();
									    data.append("i", i);
									    data.append("s", s);  
									    data.append("d", d);        
									        $.ajax({
									           url: $url,
									           data: data,
									           cache: false,
									           contentType: false,
									           dataType:'JSON',
									           processData: false,
									           type: 'POST',
									            success: function(data){  
										           if (data.success) {
										           	$.alert({
									                    title: 'Mise à jour du statut',
									                    content: 'Le statut de la rubrique a été correctement enregistré',
									                });
									                //update ui statut
									                $('#menu-toggle'+data.i).attr('style',data.statut)
									                $('#menu-toggle'+data.i).attr('title',data.t);
									                $('#corb_rub_table').dataTable().fnDraw(false)
										           }	           
										        },
									            error: function(jqXHR, textStatus, errorThrown) {
										           console.log(jqXHR.responseText+" "+errorThrown);
										        }
									        }); 
						        	}
						        },
						        cancel: {
						        	text: "Non",
						        	action : function () {
						        	    //$.alert('Confirmed!');
						        	}
						        }
						    }
						});
					})

					$('.lien_statut_pub').click(function (e){
						e.preventDefault();
						var i = $(this).attr('i');
						var d = $(this).prev('input[type=date]').val();
						var s = $(this).attr('v');
						var statut_ui = $(this).closest('.d-inline-block').find('a.toggle');
						//console.log(statut_ui);return;
						//alert("i:"+i+"//v:"+s+"//d:"+d);return;
						$.confirm({
						    title: 'Mise à jour du statut',
						    content: 'Confirmez-vous la publication de cette rubrique?',
						    buttons: {
						        confirm: {
						        	text: "Oui",
						        	btnClass: 'btn-info',
						        	action : function () {
						        	    //move_rubrique(i,current_row);
						        	    e.preventDefault();
										show_loading();
										setTimeout(function(){ hide_loading(); }, 1000);
										//alert(ti);return;
										$url = base_url+'rubriques/changer_statut';
									    data = new FormData();
									    data.append("i", i);
									    data.append("s", s);  
									    data.append("d", d);        
									        $.ajax({
									           url: $url,
									           data: data,
									           cache: false,
									           contentType: false,
									           dataType:'JSON',
									           processData: false,
									           type: 'POST',
									            success: function(data){  
										           if (data.success) {
										           	$.alert({
									                    title: 'Mise à jour du statut',
									                    content: 'Le statut de la rubrique a été correctement enregistré',
									                });
									                //update ui statut
									                $('#menu-toggle'+data.i).attr('style',data.statut)
									                $('#menu-toggle'+data.i).attr('title',data.t)
									                //statut_ui.html(data.statut)

									                $('#corb_rub_table').dataTable().fnDraw(false)
										           }	           
										        },
									            error: function(jqXHR, textStatus, errorThrown) {
										           console.log(jqXHR.responseText+" "+errorThrown);
										        }
									        }); 
						        	}
						        },
						        cancel: {
						        	text: "Non",
						        	action : function () {
						        	    //$.alert('Confirmed!');
						        	}
						        }
						    }
						});
					})

                    $('[data-menu]').menu();


                    //alert( 'DataTables has finished its initialisation.' );
                  },
            processing:true,  
              serverSide:true,
              ajax:{  
                      url: base_url+"/corbeille/parcourir_rub",  
                      type:"POST"  ,
                      dataSrc:function(j){
                        //console.log(j);
                        $('.nbtable').html(j.recordsFiltered);
                       return j.data;
                      },
                      mRender: function (data, type, ab) {
                        if (ab == null) {
                             return ''; 
                        }
                      },

            },
            createdRow: function(row, data, index) {
                $('td', row).eq(0).addClass('js-select text-left g-first-child'); // 6 is index of column
			},
            aaSorting: [[ 0, "asc" ]],
            lengthMenu: [[10, 20, -1], [10, 20, "Tout"]],
            pageLength: 8,
            iDisplayLength:25,
            language: {
             "searchPlaceholder": "Recherche",
             "sProcessing":     "Recherche en cours...",
              "sSearch":         "",
              "sLengthMenu":     "Afficher _MENU_ &eacute;l&eacute;ments &nbsp;&nbsp;&nbsp;",
              "sInfo":           "_TOTAL_ élément(s) au total  ",
              "sInfoEmpty":      "Affichage de l'&eacute;l&eacute;ment 0 &agrave; 0 sur 0 &eacute;l&eacute;ment",
              "sInfoFiltered":   "(filtr&eacute; de _MAX_ &eacute;l&eacute;ments au total)",
              "sInfoPostFix":    "",
              "sLoadingRecords": "Chargement en cours...",
              "sZeroRecords":    "Aucun &eacute;l&eacute;ment &agrave; afficher",
              "sEmptyTable":     "Aucune donn&eacute;e disponible dans le tableau",
              "oPaginate": {            
                "sFirst":      "Premier",
                "sPrevious":   "<i class='hs-admin-angle-left'><i>",
                "sNext":       "<i class='hs-admin-angle-right'><i>",
                "sLast":       "Dernier"
              },
              "oAria": {
                "sSortAscending":  ": activer pour trier la colonne par ordre croissant",
                "sSortDescending": ": activer pour trier la colonne par ordre d&eacute;croissant"
              }
            },
            /*sDom:"<'form-control g-font-size-default g-brd-gray-dark-v7 g-brd-darkblue-v3--focus g-rounded-20 g-pl-20 g-pr-50 g-py-10'>lr",*/
            dom: "<'row'<'col-sm-4'l><'col-sm-4 text-center'B><'col-sm-4'f>>tp",
            "lengthMenu": [ [10, 25, 50, -1], [10, 25, 50, "Tout"] ],
            buttons: [
                {extend: 'copy',className: 'btn-sm',text:'<i class="fa fa-copy"></i> Copier'},
                {extend: 'csv',title: 'PADME WEB CONSOLE - Liste des rubriques', className: 'btn-sm',text:'<i class="fa fa-file-excel-o"></i> CSV'},
                {extend: 'pdf', title: 'PADME WEB CONSOLE - Liste des rubriques', className: 'btn-sm',text:'<i class="fa fa-file-pdf-o"></i> PDF'},
                {extend: 'print', title: 'PADME WEB CONSOLE - Liste des rubriques',className: 'btn-sm',text:'<i class="fa fa-print"></i> Imprimer'}
            ]
});




$('#art_table').dataTable( {
            fnDrawCallback: function(settings, json) {
                    $.HSCore.components.HSDropdown.init($('[data-dropdown-target]'), {
                      dropdownHideOnScroll: false,
                      dropdownType: 'css-animation',
                      dropdownAnimationIn: 'fadeIn',
                      dropdownAnimationOut: 'fadeOut'
                    });

                    $('.art_del').on('click', function (){
                    	//alert('nf');return;
						var i = $(this).attr('i');
						var current_row = $(this).closest('tr');
						$.confirm({
						    title: 'Confirmer la mise en corbeille',
						    content: 'Cet article sera mis en corbeille',
						    buttons: {
						        confirm: {
						        	text: "OK",
						        	btnClass: 'btn-info',
						        	action : function () {
						        	    move_article(i,current_row);
						        	}
						        },
						        cancel: {
						        	text: "Annuler",
						        	action : function () {
						        	    //$.alert('Confirmed!');
						        	}
						        }
						    }
						});
					});

					$('.lien_statut').click(function (e){
						
						e.preventDefault();
						var i = $(this).attr('i');
						var d = "";
						var s = $(this).attr('v');
						var statut_ui = $(this).closest('.d-inline-block').find('a.toggle');
						$.confirm({
						    title: 'Mise à jour du statut',
						    content: 'Confirmez-vous ce changement de statut?',
						    buttons: {
						        confirm: {
						        	text: "Oui",
						        	btnClass: 'btn-info',
						        	action : function () {
										show_loading();
										setTimeout(function(){ hide_loading(); }, 1000);
										//alert(ti);return;
										$url = base_url+'articles/changer_statut';
									    data = new FormData();
									    data.append("i", i);
									    data.append("s", s);  
									    data.append("d", d);        
									        $.ajax({
									           url: $url,
									           data: data,
									           cache: false,
									           contentType: false,
									           dataType:'JSON',
									           processData: false,
									           type: 'POST',
									            success: function(data){  
										           if (data.success) {
										           	$.alert({
									                    title: 'Mise à jour du statut',
									                    content: 'Le statut de l\'article a été correctement enregistré',
									                });
									                //update ui statut
									                $('#menu-toggle'+data.i).attr('style',data.statut)
									                $('#menu-toggle'+data.i).attr('title',data.t)

									                $('#art_table').dataTable().fnDraw(false)
										           }	           
										        },
									            error: function(jqXHR, textStatus, errorThrown) {
										           console.log(jqXHR.responseText+" "+errorThrown);
										        }
									        }); 
						        	}
						        },
						        cancel: {
						        	text: "Non",
						        	action : function () {
						        	    //$.alert('Confirmed!');
						        	}
						        }
						    }
						});
					})

					$('.lien_statut_pub').click(function (e){
						e.preventDefault();
						var i = $(this).attr('i');
						var d = $(this).prev('input[type=date]').val();
						var s = $(this).attr('v');
						var statut_ui = $(this).closest('.d-inline-block').find('a.toggle');
						//console.log(statut_ui);return;
						//alert("i:"+i+"//v:"+s+"//d:"+d);return;
						$.confirm({
						    title: 'Mise à jour du statut',
						    content: 'Confirmez-vous la publication de cet article?',
						    buttons: {
						        confirm: {
						        	text: "Oui",
						        	btnClass: 'btn-info',
						        	action : function () {
						        	    //move_rubrique(i,current_row);
						        	    e.preventDefault();
										show_loading();
										setTimeout(function(){ hide_loading(); }, 1000);
										//alert(ti);return;
										$url = base_url+'articles/changer_statut';
									    data = new FormData();
									    data.append("i", i);
									    data.append("s", s);  
									    data.append("d", d);        
									        $.ajax({
									           url: $url,
									           data: data,
									           cache: false,
									           contentType: false,
									           dataType:'JSON',
									           processData: false,
									           type: 'POST',
									            success: function(data){  
										           if (data.success) {
										           	$.alert({
									                    title: 'Mise à jour du statut',
									                    content: 'Le statut de l\'article a été correctement enregistré',
									                });
									                //update ui statut
									                $('#menu-toggle'+data.i).attr('style',data.statut)
									                $('#menu-toggle'+data.i).attr('title',data.t)
									                //statut_ui.html(data.statut)

									                $('#art_table').dataTable().fnDraw(false)
										           }	           
										        },
									            error: function(jqXHR, textStatus, errorThrown) {
										           console.log(jqXHR.responseText+" "+errorThrown);
										        }
									        }); 
						        	}
						        },
						        cancel: {
						        	text: "Non",
						        	action : function () {
						        	    //$.alert('Confirmed!');
						        	}
						        }
						    }
						});
					})

                    $('[data-menu]').menu();


                    //alert( 'DataTables has finished its initialisation.' );
                  },
            processing:true,  
              serverSide:true,
              ajax:{  
                      url: base_url+"/articles/parcourir",  
                      type:"POST"  ,
                      dataSrc:function(j){
                        //console.log(j);
                        $('.nbtable').html(j.recordsFiltered);
                       return j.data;
                      },
                      mRender: function (data, type, ab) {
                        if (ab == null) {
                             return ''; 
                        }
                      },

            },
            createdRow: function(row, data, index) {
                $('td', row).eq(0).addClass('js-select text-left g-first-child'); // 6 is index of column
			},
            aaSorting: [[ 0, "desc" ]],
            lengthMenu: [[10, 20, -1], [10, 20, "Tout"]],
            pageLength: 8,
            iDisplayLength:25,
            language: {
             "searchPlaceholder": "Recherche",
             "sProcessing":     "Recherche en cours...",
              "sSearch":         "",
              "sLengthMenu":     "Afficher _MENU_ &eacute;l&eacute;ments &nbsp;&nbsp;&nbsp;",
              "sInfo":           "_TOTAL_ élément(s) au total  ",
              "sInfoEmpty":      "Affichage de l'&eacute;l&eacute;ment 0 &agrave; 0 sur 0 &eacute;l&eacute;ment",
              "sInfoFiltered":   "(filtr&eacute; de _MAX_ &eacute;l&eacute;ments au total)",
              "sInfoPostFix":    "",
              "sLoadingRecords": "Chargement en cours...",
              "sZeroRecords":    "Aucun &eacute;l&eacute;ment &agrave; afficher",
              "sEmptyTable":     "Aucune donn&eacute;e disponible dans le tableau",
              "oPaginate": {            
                "sFirst":      "Premier",
                "sPrevious":   "<i class='hs-admin-angle-left'><i>",
                "sNext":       "<i class='hs-admin-angle-right'><i>",
                "sLast":       "Dernier"
              },
              "oAria": {
                "sSortAscending":  ": activer pour trier la colonne par ordre croissant",
                "sSortDescending": ": activer pour trier la colonne par ordre d&eacute;croissant"
              }
            },
            /*sDom:"<'form-control g-font-size-default g-brd-gray-dark-v7 g-brd-darkblue-v3--focus g-rounded-20 g-pl-20 g-pr-50 g-py-10'>lr",*/
            dom: "<'row'<'col-sm-4'l><'col-sm-4 text-center'B><'col-sm-4'f>>tp",
            "lengthMenu": [ [10, 25, 50, -1], [10, 25, 50, "Tout"] ],
            buttons: [
                {extend: 'copy',className: 'btn-sm',text:'<i class="fa fa-copy"></i> Copier',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'csv',title: 'PADME WEB CONSOLE - Liste des articles', className: 'btn-sm',text:'<i class="fa fa-file-excel-o"></i> CSV',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'pdf', title: 'PADME WEB CONSOLE - Liste des articles', className: 'btn-sm',text:'<i class="fa fa-file-pdf-o"></i> PDF',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'print', title: 'PADME WEB CONSOLE - Liste des articles',className: 'btn-sm',text:'<i class="fa fa-print"></i> Imprimer',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	}
            ]
});

$('#artenc_table').dataTable( {
            fnDrawCallback: function(settings, json) {
                    $.HSCore.components.HSDropdown.init($('[data-dropdown-target]'), {
                      dropdownHideOnScroll: false,
                      dropdownType: 'css-animation',
                      dropdownAnimationIn: 'fadeIn',
                      dropdownAnimationOut: 'fadeOut'
                    });

                    $('.art_del').on('click', function (){
                    	//alert('nf');return;
						var i = $(this).attr('i');
						var current_row = $(this).closest('tr');
						$.confirm({
						    title: 'Confirmer la mise en corbeille',
						    content: 'Cet article sera mis en corbeille',
						    buttons: {
						        confirm: {
						        	text: "OK",
						        	btnClass: 'btn-info',
						        	action : function () {
						        	    move_article(i,current_row);
						        	}
						        },
						        cancel: {
						        	text: "Annuler",
						        	action : function () {
						        	    //$.alert('Confirmed!');
						        	}
						        }
						    }
						});
					});

					$('.lien_statut').click(function (e){
						
						e.preventDefault();
						var i = $(this).attr('i');
						var d = "";
						var s = $(this).attr('v');
						var statut_ui = $(this).closest('.d-inline-block').find('a.toggle');
						$.confirm({
						    title: 'Mise à jour du statut',
						    content: 'Confirmez-vous ce changement de statut?',
						    buttons: {
						        confirm: {
						        	text: "Oui",
						        	btnClass: 'btn-info',
						        	action : function () {
										show_loading();
										setTimeout(function(){ hide_loading(); }, 1000);
										//alert(ti);return;
										$url = base_url+'articles/changer_statut';
									    data = new FormData();
									    data.append("i", i);
									    data.append("s", s);  
									    data.append("d", d);        
									        $.ajax({
									           url: $url,
									           data: data,
									           cache: false,
									           contentType: false,
									           dataType:'JSON',
									           processData: false,
									           type: 'POST',
									            success: function(data){  
										           if (data.success) {
										           	$.alert({
									                    title: 'Mise à jour du statut',
									                    content: 'Le statut de l\'article a été correctement enregistré',
									                });
									                //update ui statut
									                $('#menu-toggle'+data.i).attr('style',data.statut)
									                $('#menu-toggle'+data.i).attr('title',data.t)

									                $('#art_table').dataTable().fnDraw(false)
										           }	           
										        },
									            error: function(jqXHR, textStatus, errorThrown) {
										           console.log(jqXHR.responseText+" "+errorThrown);
										        }
									        }); 
						        	}
						        },
						        cancel: {
						        	text: "Non",
						        	action : function () {
						        	    //$.alert('Confirmed!');
						        	}
						        }
						    }
						});
					})

					$('.lien_statut_pub').click(function (e){
						e.preventDefault();
						var i = $(this).attr('i');
						var d = $(this).prev('input[type=date]').val();
						var s = $(this).attr('v');
						var statut_ui = $(this).closest('.d-inline-block').find('a.toggle');
						//console.log(statut_ui);return;
						//alert("i:"+i+"//v:"+s+"//d:"+d);return;
						$.confirm({
						    title: 'Mise à jour du statut',
						    content: 'Confirmez-vous la publication de cet article?',
						    buttons: {
						        confirm: {
						        	text: "Oui",
						        	btnClass: 'btn-info',
						        	action : function () {
						        	    //move_rubrique(i,current_row);
						        	    e.preventDefault();
										show_loading();
										setTimeout(function(){ hide_loading(); }, 1000);
										//alert(ti);return;
										$url = base_url+'articles/changer_statut';
									    data = new FormData();
									    data.append("i", i);
									    data.append("s", s);  
									    data.append("d", d);        
									        $.ajax({
									           url: $url,
									           data: data,
									           cache: false,
									           contentType: false,
									           dataType:'JSON',
									           processData: false,
									           type: 'POST',
									            success: function(data){  
										           if (data.success) {
										           	$.alert({
									                    title: 'Mise à jour du statut',
									                    content: 'Le statut de l\'article a été correctement enregistré',
									                });
									                //update ui statut
									                $('#menu-toggle'+data.i).attr('style',data.statut)
									                $('#menu-toggle'+data.i).attr('title',data.t)
									                //statut_ui.html(data.statut)

									                $('#art_table').dataTable().fnDraw(false)
										           }	           
										        },
									            error: function(jqXHR, textStatus, errorThrown) {
										           console.log(jqXHR.responseText+" "+errorThrown);
										        }
									        }); 
						        	}
						        },
						        cancel: {
						        	text: "Non",
						        	action : function () {
						        	    //$.alert('Confirmed!');
						        	}
						        }
						    }
						});
					})

                    $('[data-menu]').menu();


                    //alert( 'DataTables has finished its initialisation.' );
                  },
            processing:true,  
              serverSide:true,
              ajax:{  
                      url: base_url+"/articles/parcourir/encours",  
                      type:"POST"  ,
                      dataSrc:function(j){
                        //console.log(j);
                        $('.nbtable').html(j.recordsFiltered);
                       return j.data;
                      },
                      mRender: function (data, type, ab) {
                        if (ab == null) {
                             return ''; 
                        }
                      },

            },
            createdRow: function(row, data, index) {
                $('td', row).eq(0).addClass('js-select text-left g-first-child'); // 6 is index of column
			},
            aaSorting: [[ 0, "asc" ]],
            lengthMenu: [[10, 20, -1], [10, 20, "Tout"]],
            pageLength: 8,
            iDisplayLength:25,
            language: {
             "searchPlaceholder": "Recherche",
             "sProcessing":     "Recherche en cours...",
              "sSearch":         "",
              "sLengthMenu":     "Afficher _MENU_ &eacute;l&eacute;ments &nbsp;&nbsp;&nbsp;",
              "sInfo":           "_TOTAL_ élément(s) au total  ",
              "sInfoEmpty":      "Affichage de l'&eacute;l&eacute;ment 0 &agrave; 0 sur 0 &eacute;l&eacute;ment",
              "sInfoFiltered":   "(filtr&eacute; de _MAX_ &eacute;l&eacute;ments au total)",
              "sInfoPostFix":    "",
              "sLoadingRecords": "Chargement en cours...",
              "sZeroRecords":    "Aucun &eacute;l&eacute;ment &agrave; afficher",
              "sEmptyTable":     "Aucune donn&eacute;e disponible dans le tableau",
              "oPaginate": {            
                "sFirst":      "Premier",
                "sPrevious":   "<i class='hs-admin-angle-left'><i>",
                "sNext":       "<i class='hs-admin-angle-right'><i>",
                "sLast":       "Dernier"
              },
              "oAria": {
                "sSortAscending":  ": activer pour trier la colonne par ordre croissant",
                "sSortDescending": ": activer pour trier la colonne par ordre d&eacute;croissant"
              }
            },
            /*sDom:"<'form-control g-font-size-default g-brd-gray-dark-v7 g-brd-darkblue-v3--focus g-rounded-20 g-pl-20 g-pr-50 g-py-10'>lr",*/
            dom: "<'row'<'col-sm-4'l><'col-sm-4 text-center'B><'col-sm-4'f>>tp",
            "lengthMenu": [ [10, 25, 50, -1], [10, 25, 50, "Tout"] ],
            buttons: [
                {extend: 'copy',className: 'btn-sm',text:'<i class="fa fa-copy"></i> Copier',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'csv',title: 'PADME WEB CONSOLE - Liste des utilisateurs', className: 'btn-sm',text:'<i class="fa fa-file-excel-o"></i> CSV',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'pdf', title: 'PADME WEB CONSOLE - Liste des utilisateurs', className: 'btn-sm',text:'<i class="fa fa-file-pdf-o"></i> PDF',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'print', title: 'PADME WEB CONSOLE - Liste des utilisateurs',className: 'btn-sm',text:'<i class="fa fa-print"></i> Imprimer',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	}
            ]
});

$('#arcpub_table').dataTable( {
            fnDrawCallback: function(settings, json) {
                    $.HSCore.components.HSDropdown.init($('[data-dropdown-target]'), {
                      dropdownHideOnScroll: false,
                      dropdownType: 'css-animation',
                      dropdownAnimationIn: 'fadeIn',
                      dropdownAnimationOut: 'fadeOut'
                    });

                    $('.art_del').on('click', function (){
                    	//alert('nf');return;
						var i = $(this).attr('i');
						var current_row = $(this).closest('tr');
						$.confirm({
						    title: 'Confirmer la mise en corbeille',
						    content: 'Cet article sera mis en corbeille',
						    buttons: {
						        confirm: {
						        	text: "OK",
						        	btnClass: 'btn-info',
						        	action : function () {
						        	    move_article(i,current_row);
						        	}
						        },
						        cancel: {
						        	text: "Annuler",
						        	action : function () {
						        	    //$.alert('Confirmed!');
						        	}
						        }
						    }
						});
					});

					$('.lien_statut').click(function (e){
						
						e.preventDefault();
						var i = $(this).attr('i');
						var d = "";
						var s = $(this).attr('v');
						var statut_ui = $(this).closest('.d-inline-block').find('a.toggle');
						$.confirm({
						    title: 'Mise à jour du statut',
						    content: 'Confirmez-vous ce changement de statut?',
						    buttons: {
						        confirm: {
						        	text: "Oui",
						        	btnClass: 'btn-info',
						        	action : function () {
										show_loading();
										setTimeout(function(){ hide_loading(); }, 1000);
										//alert(ti);return;
										$url = base_url+'articles/changer_statut';
									    data = new FormData();
									    data.append("i", i);
									    data.append("s", s);  
									    data.append("d", d);        
									        $.ajax({
									           url: $url,
									           data: data,
									           cache: false,
									           contentType: false,
									           dataType:'JSON',
									           processData: false,
									           type: 'POST',
									            success: function(data){  
										           if (data.success) {
										           	$.alert({
									                    title: 'Mise à jour du statut',
									                    content: 'Le statut de l\'article a été correctement enregistré',
									                });
									                //update ui statut
									                $('#menu-toggle'+data.i).attr('style',data.statut)
									                $('#menu-toggle'+data.i).attr('title',data.t)

									                $('#art_table').dataTable().fnDraw(false)
										           }	           
										        },
									            error: function(jqXHR, textStatus, errorThrown) {
										           console.log(jqXHR.responseText+" "+errorThrown);
										        }
									        }); 
						        	}
						        },
						        cancel: {
						        	text: "Non",
						        	action : function () {
						        	    //$.alert('Confirmed!');
						        	}
						        }
						    }
						});
					})

					$('.lien_statut_pub').click(function (e){
						e.preventDefault();
						var i = $(this).attr('i');
						var d = $(this).prev('input[type=date]').val();
						var s = $(this).attr('v');
						var statut_ui = $(this).closest('.d-inline-block').find('a.toggle');
						//console.log(statut_ui);return;
						//alert("i:"+i+"//v:"+s+"//d:"+d);return;
						$.confirm({
						    title: 'Mise à jour du statut',
						    content: 'Confirmez-vous la publication de cet article?',
						    buttons: {
						        confirm: {
						        	text: "Oui",
						        	btnClass: 'btn-info',
						        	action : function () {
						        	    //move_rubrique(i,current_row);
						        	    e.preventDefault();
										show_loading();
										setTimeout(function(){ hide_loading(); }, 1000);
										//alert(ti);return;
										$url = base_url+'articles/changer_statut';
									    data = new FormData();
									    data.append("i", i);
									    data.append("s", s);  
									    data.append("d", d);        
									        $.ajax({
									           url: $url,
									           data: data,
									           cache: false,
									           contentType: false,
									           dataType:'JSON',
									           processData: false,
									           type: 'POST',
									            success: function(data){  
										           if (data.success) {
										           	$.alert({
									                    title: 'Mise à jour du statut',
									                    content: 'Le statut de l\'article a été correctement enregistré',
									                });
									                //update ui statut
									                $('#menu-toggle'+data.i).attr('style',data.statut)
									                $('#menu-toggle'+data.i).attr('title',data.t)
									                //statut_ui.html(data.statut)

									                $('#art_table').dataTable().fnDraw(false)
										           }	           
										        },
									            error: function(jqXHR, textStatus, errorThrown) {
										           console.log(jqXHR.responseText+" "+errorThrown);
										        }
									        }); 
						        	}
						        },
						        cancel: {
						        	text: "Non",
						        	action : function () {
						        	    //$.alert('Confirmed!');
						        	}
						        }
						    }
						});
					})

                    $('[data-menu]').menu();


                    //alert( 'DataTables has finished its initialisation.' );
                  },
            processing:true,  
              serverSide:true,
              ajax:{  
                      url: base_url+"/articles/parcourir/publie",  
                      type:"POST"  ,
                      dataSrc:function(j){
                        //console.log(j);
                        $('.nbtable').html(j.recordsFiltered);
                       return j.data;
                      },
                      mRender: function (data, type, ab) {
                        if (ab == null) {
                             return ''; 
                        }
                      },

            },
            createdRow: function(row, data, index) {
                $('td', row).eq(0).addClass('js-select text-left g-first-child'); // 6 is index of column
			},
            aaSorting: [[ 0, "asc" ]],
            lengthMenu: [[10, 20, -1], [10, 20, "Tout"]],
            pageLength: 8,
            iDisplayLength:25,
            language: {
             "searchPlaceholder": "Recherche",
             "sProcessing":     "Recherche en cours...",
              "sSearch":         "",
              "sLengthMenu":     "Afficher _MENU_ &eacute;l&eacute;ments &nbsp;&nbsp;&nbsp;",
              "sInfo":           "_TOTAL_ élément(s) au total  ",
              "sInfoEmpty":      "Affichage de l'&eacute;l&eacute;ment 0 &agrave; 0 sur 0 &eacute;l&eacute;ment",
              "sInfoFiltered":   "(filtr&eacute; de _MAX_ &eacute;l&eacute;ments au total)",
              "sInfoPostFix":    "",
              "sLoadingRecords": "Chargement en cours...",
              "sZeroRecords":    "Aucun &eacute;l&eacute;ment &agrave; afficher",
              "sEmptyTable":     "Aucune donn&eacute;e disponible dans le tableau",
              "oPaginate": {            
                "sFirst":      "Premier",
                "sPrevious":   "<i class='hs-admin-angle-left'><i>",
                "sNext":       "<i class='hs-admin-angle-right'><i>",
                "sLast":       "Dernier"
              },
              "oAria": {
                "sSortAscending":  ": activer pour trier la colonne par ordre croissant",
                "sSortDescending": ": activer pour trier la colonne par ordre d&eacute;croissant"
              }
            },
            /*sDom:"<'form-control g-font-size-default g-brd-gray-dark-v7 g-brd-darkblue-v3--focus g-rounded-20 g-pl-20 g-pr-50 g-py-10'>lr",*/
            dom: "<'row'<'col-sm-4'l><'col-sm-4 text-center'B><'col-sm-4'f>>tp",
            "lengthMenu": [ [10, 25, 50, -1], [10, 25, 50, "Tout"] ],
            buttons: [
                {extend: 'copy',className: 'btn-sm',text:'<i class="fa fa-copy"></i> Copier',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'csv',title: 'PADME WEB CONSOLE - Liste des utilisateurs', className: 'btn-sm',text:'<i class="fa fa-file-excel-o"></i> CSV',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'pdf', title: 'PADME WEB CONSOLE - Liste des utilisateurs', className: 'btn-sm',text:'<i class="fa fa-file-pdf-o"></i> PDF',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'print', title: 'PADME WEB CONSOLE - Liste des utilisateurs',className: 'btn-sm',text:'<i class="fa fa-print"></i> Imprimer',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	}
            ]
});

$('#arcpro_table').dataTable( {
            fnDrawCallback: function(settings, json) {
                    $.HSCore.components.HSDropdown.init($('[data-dropdown-target]'), {
                      dropdownHideOnScroll: false,
                      dropdownType: 'css-animation',
                      dropdownAnimationIn: 'fadeIn',
                      dropdownAnimationOut: 'fadeOut'
                    });

                    $('.art_del').on('click', function (){
                    	//alert('nf');return;
						var i = $(this).attr('i');
						var current_row = $(this).closest('tr');
						$.confirm({
						    title: 'Confirmer la mise en corbeille',
						    content: 'Cet article sera mis en corbeille',
						    buttons: {
						        confirm: {
						        	text: "OK",
						        	btnClass: 'btn-info',
						        	action : function () {
						        	    move_article(i,current_row);
						        	}
						        },
						        cancel: {
						        	text: "Annuler",
						        	action : function () {
						        	    //$.alert('Confirmed!');
						        	}
						        }
						    }
						});
					});

					$('.lien_statut').click(function (e){
						
						e.preventDefault();
						var i = $(this).attr('i');
						var d = "";
						var s = $(this).attr('v');
						var statut_ui = $(this).closest('.d-inline-block').find('a.toggle');
						$.confirm({
						    title: 'Mise à jour du statut',
						    content: 'Confirmez-vous ce changement de statut?',
						    buttons: {
						        confirm: {
						        	text: "Oui",
						        	btnClass: 'btn-info',
						        	action : function () {
										show_loading();
										setTimeout(function(){ hide_loading(); }, 1000);
										//alert(ti);return;
										$url = base_url+'articles/changer_statut';
									    data = new FormData();
									    data.append("i", i);
									    data.append("s", s);  
									    data.append("d", d);        
									        $.ajax({
									           url: $url,
									           data: data,
									           cache: false,
									           contentType: false,
									           dataType:'JSON',
									           processData: false,
									           type: 'POST',
									            success: function(data){  
										           if (data.success) {
										           	$.alert({
									                    title: 'Mise à jour du statut',
									                    content: 'Le statut de l\'article a été correctement enregistré',
									                });
									                //update ui statut
									                $('#menu-toggle'+data.i).attr('style',data.statut)
									                $('#menu-toggle'+data.i).attr('title',data.t)

									                $('#art_table').dataTable().fnDraw(false)
										           }	           
										        },
									            error: function(jqXHR, textStatus, errorThrown) {
										           console.log(jqXHR.responseText+" "+errorThrown);
										        }
									        }); 
						        	}
						        },
						        cancel: {
						        	text: "Non",
						        	action : function () {
						        	    //$.alert('Confirmed!');
						        	}
						        }
						    }
						});
					})

					$('.lien_statut_pub').click(function (e){
						e.preventDefault();
						var i = $(this).attr('i');
						var d = $(this).prev('input[type=date]').val();
						var s = $(this).attr('v');
						var statut_ui = $(this).closest('.d-inline-block').find('a.toggle');
						//console.log(statut_ui);return;
						//alert("i:"+i+"//v:"+s+"//d:"+d);return;
						$.confirm({
						    title: 'Mise à jour du statut',
						    content: 'Confirmez-vous la publication de cet article?',
						    buttons: {
						        confirm: {
						        	text: "Oui",
						        	btnClass: 'btn-info',
						        	action : function () {
						        	    //move_rubrique(i,current_row);
						        	    e.preventDefault();
										show_loading();
										setTimeout(function(){ hide_loading(); }, 1000);
										//alert(ti);return;
										$url = base_url+'articles/changer_statut';
									    data = new FormData();
									    data.append("i", i);
									    data.append("s", s);  
									    data.append("d", d);        
									        $.ajax({
									           url: $url,
									           data: data,
									           cache: false,
									           contentType: false,
									           dataType:'JSON',
									           processData: false,
									           type: 'POST',
									            success: function(data){  
										           if (data.success) {
										           	$.alert({
									                    title: 'Mise à jour du statut',
									                    content: 'Le statut de l\'article a été correctement enregistré',
									                });
									                //update ui statut
									                $('#menu-toggle'+data.i).attr('style',data.statut)
									                $('#menu-toggle'+data.i).attr('title',data.t)
									                //statut_ui.html(data.statut)

									                $('#art_table').dataTable().fnDraw(false)
										           }	           
										        },
									            error: function(jqXHR, textStatus, errorThrown) {
										           console.log(jqXHR.responseText+" "+errorThrown);
										        }
									        }); 
						        	}
						        },
						        cancel: {
						        	text: "Non",
						        	action : function () {
						        	    //$.alert('Confirmed!');
						        	}
						        }
						    }
						});
					})

                    $('[data-menu]').menu();


                    //alert( 'DataTables has finished its initialisation.' );
                  },
            processing:true,  
              serverSide:true,
              ajax:{  
                      url: base_url+"/articles/parcourir/propose",  
                      type:"POST"  ,
                      dataSrc:function(j){
                        //console.log(j);
                        $('.nbtable').html(j.recordsFiltered);
                       return j.data;
                      },
                      mRender: function (data, type, ab) {
                        if (ab == null) {
                             return ''; 
                        }
                      },

            },
            createdRow: function(row, data, index) {
                $('td', row).eq(0).addClass('js-select text-left g-first-child'); // 6 is index of column
			},
            aaSorting: [[ 0, "asc" ]],
            lengthMenu: [[10, 20, -1], [10, 20, "Tout"]],
            pageLength: 8,
            iDisplayLength:25,
            language: {
             "searchPlaceholder": "Recherche",
             "sProcessing":     "Recherche en cours...",
              "sSearch":         "",
              "sLengthMenu":     "Afficher _MENU_ &eacute;l&eacute;ments &nbsp;&nbsp;&nbsp;",
              "sInfo":           "_TOTAL_ élément(s) au total  ",
              "sInfoEmpty":      "Affichage de l'&eacute;l&eacute;ment 0 &agrave; 0 sur 0 &eacute;l&eacute;ment",
              "sInfoFiltered":   "(filtr&eacute; de _MAX_ &eacute;l&eacute;ments au total)",
              "sInfoPostFix":    "",
              "sLoadingRecords": "Chargement en cours...",
              "sZeroRecords":    "Aucun &eacute;l&eacute;ment &agrave; afficher",
              "sEmptyTable":     "Aucune donn&eacute;e disponible dans le tableau",
              "oPaginate": {            
                "sFirst":      "Premier",
                "sPrevious":   "<i class='hs-admin-angle-left'><i>",
                "sNext":       "<i class='hs-admin-angle-right'><i>",
                "sLast":       "Dernier"
              },
              "oAria": {
                "sSortAscending":  ": activer pour trier la colonne par ordre croissant",
                "sSortDescending": ": activer pour trier la colonne par ordre d&eacute;croissant"
              }
            },
            /*sDom:"<'form-control g-font-size-default g-brd-gray-dark-v7 g-brd-darkblue-v3--focus g-rounded-20 g-pl-20 g-pr-50 g-py-10'>lr",*/
            dom: "<'row'<'col-sm-4'l><'col-sm-4 text-center'B><'col-sm-4'f>>tp",
            "lengthMenu": [ [10, 25, 50, -1], [10, 25, 50, "Tout"] ],
            buttons: [
                {extend: 'copy',className: 'btn-sm',text:'<i class="fa fa-copy"></i> Copier',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'csv',title: 'PADME WEB CONSOLE - Liste des utilisateurs', className: 'btn-sm',text:'<i class="fa fa-file-excel-o"></i> CSV',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'pdf', title: 'PADME WEB CONSOLE - Liste des utilisateurs', className: 'btn-sm',text:'<i class="fa fa-file-pdf-o"></i> PDF',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'print', title: 'PADME WEB CONSOLE - Liste des utilisateurs',className: 'btn-sm',text:'<i class="fa fa-print"></i> Imprimer',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	}
            ]
});

$('#corb_art_table').dataTable( {
            fnDrawCallback: function(settings, json) {
                    $.HSCore.components.HSDropdown.init($('[data-dropdown-target]'), {
                      dropdownHideOnScroll: false,
                      dropdownType: 'css-animation',
                      dropdownAnimationIn: 'fadeIn',
                      dropdownAnimationOut: 'fadeOut'
                    });

                    $('.art_hard_del').click(function (){
						var i = $(this).attr('i');
						var current_row = $(this).closest('tr');
						$.confirm({
							title: 'Cette opération est irréversible ',
							content: 'Voulez-vous vraiment supprimer définitivement cet article de la base?',
							buttons: {
								confirm: {
									text: "OK",
									btnClass: 'btn-info',
									action : function () {
										sup_article(i,current_row);
									}
								},
								cancel: {
									text: "Annuler",
									action : function () {
										//$.alert('Confirmed!');
									}
								}
							}
						});
					})

					$('.lien_statut').click(function (e){
						
						e.preventDefault();
						var i = $(this).attr('i');
						var d = "";
						var s = $(this).attr('v');
						var statut_ui = $(this).closest('.d-inline-block').find('a.toggle');
						$.confirm({
						    title: 'Mise à jour du statut',
						    content: 'Confirmez-vous ce changement de statut?',
						    buttons: {
						        confirm: {
						        	text: "Oui",
						        	btnClass: 'btn-info',
						        	action : function () {
										show_loading();
										setTimeout(function(){ hide_loading(); }, 1000);
										//alert(ti);return;
										$url = base_url+'articles/changer_statut';
									    data = new FormData();
									    data.append("i", i);
									    data.append("s", s);  
									    data.append("d", d);        
									        $.ajax({
									           url: $url,
									           data: data,
									           cache: false,
									           contentType: false,
									           dataType:'JSON',
									           processData: false,
									           type: 'POST',
									            success: function(data){  
										           if (data.success) {
										           	$.alert({
									                    title: 'Mise à jour du statut',
									                    content: 'Le statut de l\'article a été correctement enregistré',
									                });
									                //update ui statut
									                $('#menu-toggle'+data.i).attr('style',data.statut)
									                $('#menu-toggle'+data.i).attr('title',data.t)
									                $('#corb_art_table').dataTable().fnDraw(false)
										           }	           
										        },
									            error: function(jqXHR, textStatus, errorThrown) {
										           console.log(jqXHR.responseText+" "+errorThrown);
										        }
									        }); 
						        	}
						        },
						        cancel: {
						        	text: "Non",
						        	action : function () {
						        	    //$.alert('Confirmed!');
						        	}
						        }
						    }
						});
					})

					$('.lien_statut_pub').click(function (e){
						e.preventDefault();
						var i = $(this).attr('i');
						var d = $(this).prev('input[type=date]').val();
						var s = $(this).attr('v');
						var statut_ui = $(this).closest('.d-inline-block').find('a.toggle');
						//console.log(statut_ui);return;
						//alert("i:"+i+"//v:"+s+"//d:"+d);return;
						$.confirm({
						    title: 'Mise à jour du statut',
						    content: 'Confirmez-vous la publication de cet article?',
						    buttons: {
						        confirm: {
						        	text: "Oui",
						        	btnClass: 'btn-info',
						        	action : function () {
						        	    //move_rubrique(i,current_row);
						        	    e.preventDefault();
										show_loading();
										setTimeout(function(){ hide_loading(); }, 1000);
										//alert(ti);return;
										$url = base_url+'articles/changer_statut';
									    data = new FormData();
									    data.append("i", i);
									    data.append("s", s);  
									    data.append("d", d);        
									        $.ajax({
									           url: $url,
									           data: data,
									           cache: false,
									           contentType: false,
									           dataType:'JSON',
									           processData: false,
									           type: 'POST',
									            success: function(data){  
										           if (data.success) {
										           	$.alert({
									                    title: 'Mise à jour du statut',
									                    content: 'Le statut de l\'article a été correctement enregistré',
									                });
									                //update ui statut
									                $('#menu-toggle'+data.i).attr('style',data.statut)
									                $('#menu-toggle'+data.i).attr('title',data.t)
									                //statut_ui.html(data.statut)
									                $('#corb_art_table').dataTable().fnDraw(false)
										           }	           
										        },
									            error: function(jqXHR, textStatus, errorThrown) {
										           console.log(jqXHR.responseText+" "+errorThrown);
										        }
									        }); 
						        	}
						        },
						        cancel: {
						        	text: "Non",
						        	action : function () {
						        	    //$.alert('Confirmed!');
						        	}
						        }
						    }
						});
					})

                    $('[data-menu]').menu();


                    //alert( 'DataTables has finished its initialisation.' );
                  },
            processing:true,  
              serverSide:true,
              ajax:{  
                      url: base_url+"/corbeille/parcourir_art",  
                      type:"POST"  ,
                      dataSrc:function(j){
                        //console.log(j);
                        $('.nbtable').html(j.recordsFiltered);
                       return j.data;
                      },
                      mRender: function (data, type, ab) {
                        if (ab == null) {
                             return ''; 
                        }
                      },

            },
            createdRow: function(row, data, index) {
                $('td', row).eq(0).addClass('js-select text-left g-first-child'); // 6 is index of column
			},
            aaSorting: [[ 0, "asc" ]],
            lengthMenu: [[10, 20, -1], [10, 20, "Tout"]],
            pageLength: 8,
            iDisplayLength:25,
            language: {
             "searchPlaceholder": "Recherche",
             "sProcessing":     "Recherche en cours...",
              "sSearch":         "",
              "sLengthMenu":     "Afficher _MENU_ &eacute;l&eacute;ments &nbsp;&nbsp;&nbsp;",
              "sInfo":           "_TOTAL_ élément(s) au total  ",
              "sInfoEmpty":      "Affichage de l'&eacute;l&eacute;ment 0 &agrave; 0 sur 0 &eacute;l&eacute;ment",
              "sInfoFiltered":   "(filtr&eacute; de _MAX_ &eacute;l&eacute;ments au total)",
              "sInfoPostFix":    "",
              "sLoadingRecords": "Chargement en cours...",
              "sZeroRecords":    "Aucun &eacute;l&eacute;ment &agrave; afficher",
              "sEmptyTable":     "Aucune donn&eacute;e disponible dans le tableau",
              "oPaginate": {            
                "sFirst":      "Premier",
                "sPrevious":   "<i class='hs-admin-angle-left'><i>",
                "sNext":       "<i class='hs-admin-angle-right'><i>",
                "sLast":       "Dernier"
              },
              "oAria": {
                "sSortAscending":  ": activer pour trier la colonne par ordre croissant",
                "sSortDescending": ": activer pour trier la colonne par ordre d&eacute;croissant"
              }
            },
            /*sDom:"<'form-control g-font-size-default g-brd-gray-dark-v7 g-brd-darkblue-v3--focus g-rounded-20 g-pl-20 g-pr-50 g-py-10'>lr",*/
            dom: "<'row'<'col-sm-4'l><'col-sm-4 text-center'B><'col-sm-4'f>>tp",
            "lengthMenu": [ [10, 25, 50, -1], [10, 25, 50, "Tout"] ],
            buttons: [
                {extend: 'copy',className: 'btn-sm',text:'<i class="fa fa-copy"></i> Copier'},
                {extend: 'csv',title: 'PADME WEB CONSOLE - Liste des articles', className: 'btn-sm',text:'<i class="fa fa-file-excel-o"></i> CSV'},
                {extend: 'pdf', title: 'PADME WEB CONSOLE - Liste des articles', className: 'btn-sm',text:'<i class="fa fa-file-pdf-o"></i> PDF'},
                {extend: 'print', title: 'PADME WEB CONSOLE - Liste des articles',className: 'btn-sm',text:'<i class="fa fa-print"></i> Imprimer'}
            ]
});

$('.log_link_detail').click(function(e){
	e.preventDefault();
	var dt = $(this).attr('dt')
	var t = $(this).closest('td').prev('td').text()
	//alert(t)
	$('.log_detail').html(dt);
	$('.log_activite').html(t);

})

$('#journal').dataTable({
	fnDrawCallback: function(settings, json) {
                    $.HSCore.components.HSModalWindow.init('[data-modal-target]');
                    $('.log_link_detail').click(function(e){
						e.preventDefault();
						var dt = $(this).attr('dt')
						var t = $(this).closest('td').prev('td').text()
						//alert(t)
						$('.log_detail').html(dt);
						$('.log_activite').html(t);

					})
                    

                    //alert( 'DataTables has finished its initialisation.' );
                  },
	aaSorting: [],
            lengthMenu: [[10, 20, -1], [10, 20, "Tout"]],
            pageLength: 10,
            iDisplayLength:25,
            language: {
             "searchPlaceholder": "Recherche",
             "sProcessing":     "Recherche en cours...",
              "sSearch":         "",
              "sLengthMenu":     "Afficher _MENU_ &eacute;l&eacute;ments &nbsp;&nbsp;&nbsp;",
              "sInfo":           "_TOTAL_ élément(s) au total  ",
              "sInfoEmpty":      "Affichage de l'&eacute;l&eacute;ment 0 &agrave; 0 sur 0 &eacute;l&eacute;ment",
              "sInfoFiltered":   "(filtr&eacute; de _MAX_ &eacute;l&eacute;ments au total)",
              "sInfoPostFix":    "",
              "sLoadingRecords": "Chargement en cours...",
              "sZeroRecords":    "Aucun &eacute;l&eacute;ment &agrave; afficher",
              "sEmptyTable":     "Aucune donn&eacute;e disponible dans le tableau",
              "oPaginate": {            
                "sFirst":      "Premier",
                "sPrevious":   "<i class='hs-admin-angle-left'><i>",
                "sNext":       "<i class='hs-admin-angle-right'><i>",
                "sLast":       "Dernier"
              },
              "oAria": {
                "sSortAscending":  ": activer pour trier la colonne par ordre croissant",
                "sSortDescending": ": activer pour trier la colonne par ordre d&eacute;croissant"
              }
            },
            /*sDom:"<'form-control g-font-size-default g-brd-gray-dark-v7 g-brd-darkblue-v3--focus g-rounded-20 g-pl-20 g-pr-50 g-py-10'>lr",*/
            dom: "<'row'<'col-sm-4'l><'col-sm-4 text-center'B><'col-sm-4'f>>tp",
            "lengthMenu": [ [10, 25, 50, -1], [10, 25, 50, "Tout"] ],
            buttons: [
                {extend: 'copy',className: 'btn-sm',text:'<i class="fa fa-copy"></i> Copier'},
                {extend: 'csv',title: 'PADME WEB CONSOLE - Liste des activités journalisées', className: 'btn-sm',text:'<i class="fa fa-file-excel-o"></i> CSV'},
                {extend: 'pdf', title: 'PADME WEB CONSOLE - Liste des activités journalisées', className: 'btn-sm',text:'<i class="fa fa-file-pdf-o"></i> PDF'},
                {extend: 'print', title: 'PADME WEB CONSOLE - Liste des activités journalisées',className: 'btn-sm',text:'<i class="fa fa-print"></i> Imprimer'}
            ]
});

$('#user_table').dataTable( {
            fnDrawCallback: function(settings, json) {
                    $.HSCore.components.HSDropdown.init($('[data-dropdown-target]'), {
                      dropdownHideOnScroll: false,
                      dropdownType: 'css-animation',
                      dropdownAnimationIn: 'fadeIn',
                      dropdownAnimationOut: 'fadeOut'
                    });

                    $('.aut_del').on('click', function (){
						var i = $(this).attr('i');
						var current_row = $(this).closest('tr');
						$.confirm({
						    title: 'Confirmer la mise en corbeille',
						    content: 'Cet auteur sera mis en corbeille',
						    buttons: {
						        confirm: {
						        	text: "OK",
						        	btnClass: 'btn-info',
						        	action : function () {
						        	    move_auteur(i,current_row);
						        	    $('#user_table').dataTable().fnDraw(false);
						        	}
						        },
						        cancel: {
						        	text: "Annuler",
						        	action : function () {
						        	    //$.alert('Confirmed!');
						        	}
						        }
						    }
						});
					});

					$('.aut_lien_statut').click(function (e){
						
						e.preventDefault();
						var i = $(this).attr('i');
						var s = $(this).attr('v');
						var statut_ui = $(this).closest('.d-inline-block').find('a.toggle');
						$.confirm({
						    title: 'Mise à jour du statut',
						    content: 'Confirmez-vous ce changement de statut?',
						    buttons: {
						        confirm: {
						        	text: "Oui",
						        	btnClass: 'btn-info',
						        	action : function () {
										show_loading();
										setTimeout(function(){ hide_loading(); }, 1000);
										//alert(ti);return;
										$url = base_url+'utilisateurs/changer_statut';
									    data = new FormData();
									    data.append("i", i);
									    data.append("s", s);       
									        $.ajax({
									           url: $url,
									           data: data,
									           cache: false,
									           contentType: false,
									           dataType:'JSON',
									           processData: false,
									           type: 'POST',
									            success: function(data){  
										           if (data.success) {
										           	$.alert({
									                    title: 'Mise à jour du statut',
									                    content: 'Le statut de l\'utilisateur a été correctement enregistré',
									                });
									                //update ui statut
									                $('#menu-toggle'+data.i).attr('style',data.statut)
									                $('#menu-toggle'+data.i).attr('title',data.t);
									                $('#user_table').dataTable().fnDraw(false);
									                //console.log(t)
									                //t.fnDraw(false);
										           }	           
										        },
									            error: function(jqXHR, textStatus, errorThrown) {
										           console.log(jqXHR.responseText+" "+errorThrown);
										        }
									        }); 
						        	}
						        },
						        cancel: {
						        	text: "Non",
						        	action : function () {
						        	    //$.alert('Confirmed!');
						        	}
						        }
						    }
						});
					})

					$('.lien_statut_pub').click(function (e){
						e.preventDefault();
						var i = $(this).attr('i');
						var d = $(this).prev('input[type=date]').val();
						var s = $(this).attr('v');
						var statut_ui = $(this).closest('.d-inline-block').find('a.toggle');
						//console.log(statut_ui);return;
						//alert("i:"+i+"//v:"+s+"//d:"+d);return;
						$.confirm({
						    title: 'Mise à jour du statut',
						    content: 'Confirmez-vous la publication de cette rubrique?',
						    buttons: {
						        confirm: {
						        	text: "Oui",
						        	btnClass: 'btn-info',
						        	action : function () {
						        	    //move_rubrique(i,current_row);
						        	    e.preventDefault();
										show_loading();
										setTimeout(function(){ hide_loading(); }, 1000);
										//alert(ti);return;
										$url = base_url+'rubriques/changer_statut';
									    data = new FormData();
									    data.append("i", i);
									    data.append("s", s);  
									    data.append("d", d);        
									        $.ajax({
									           url: $url,
									           data: data,
									           cache: false,
									           contentType: false,
									           dataType:'JSON',
									           processData: false,
									           type: 'POST',
									            success: function(data){  
										           if (data.success) {
										           	$.alert({
									                    title: 'Mise à jour du statut',
									                    content: 'Le statut de la rubrique a été correctement enregistré',
									                });
									                //update ui statut
									                $('#menu-toggle'+data.i).attr('style',data.statut)
									                $('#menu-toggle'+data.i).attr('title',data.t)
									                //statut_ui.html(data.statut)
										           }	           
										        },
									            error: function(jqXHR, textStatus, errorThrown) {
										           console.log(jqXHR.responseText+" "+errorThrown);
										        }
									        }); 
						        	}
						        },
						        cancel: {
						        	text: "Non",
						        	action : function () {
						        	    //$.alert('Confirmed!');
						        	}
						        }
						    }
						});
					})

                    $('[data-menu]').menu();


                    //alert( 'DataTables has finished its initialisation.' );
                  },
            processing:true,  
              serverSide:true,
              ajax:{  
                      url: base_url+"/utilisateurs/fetch",  
                      type:"POST"  ,
                      dataSrc:function(j){
                        //console.log(j);
                        $('.nbtable').html(j.recordsFiltered);
                       return j.data;
                      },
                      mRender: function (data, type, ab) {
                        if (ab == null) {
                             return ''; 
                        }
                      },

            },
            createdRow: function(row, data, index) {
                $('td', row).eq(0).addClass('js-select text-left g-first-child'); // 6 is index of column
			},
            aaSorting: [[ 0, "asc" ]],
            lengthMenu: [[10, 20, -1], [10, 20, "Tout"]],
            pageLength: 8,
            iDisplayLength:25,
            language: {
             "searchPlaceholder": "Recherche",
             "sProcessing":     "Recherche en cours...",
              "sSearch":         "",
              "sLengthMenu":     "Afficher _MENU_ &eacute;l&eacute;ments &nbsp;&nbsp;&nbsp;",
              "sInfo":           "_TOTAL_ élément(s) au total  ",
              "sInfoEmpty":      "Affichage de l'&eacute;l&eacute;ment 0 &agrave; 0 sur 0 &eacute;l&eacute;ment",
              "sInfoFiltered":   "(filtr&eacute; de _MAX_ &eacute;l&eacute;ments au total)",
              "sInfoPostFix":    "",
              "sLoadingRecords": "Chargement en cours...",
              "sZeroRecords":    "Aucun &eacute;l&eacute;ment &agrave; afficher",
              "sEmptyTable":     "Aucune donn&eacute;e disponible dans le tableau",
              "oPaginate": {            
                "sFirst":      "Premier",
                "sPrevious":   "<i class='hs-admin-angle-left'><i>",
                "sNext":       "<i class='hs-admin-angle-right'><i>",
                "sLast":       "Dernier"
              },
              "oAria": {
                "sSortAscending":  ": activer pour trier la colonne par ordre croissant",
                "sSortDescending": ": activer pour trier la colonne par ordre d&eacute;croissant"
              }
            },
            /*sDom:"<'form-control g-font-size-default g-brd-gray-dark-v7 g-brd-darkblue-v3--focus g-rounded-20 g-pl-20 g-pr-50 g-py-10'>lr",*/
            dom: "<'row'<'col-sm-4'l><'col-sm-4 text-center'B><'col-sm-4'f>>tp",
            "lengthMenu": [ [10, 25, 50, -1], [10, 25, 50, "Tout"] ],
            buttons: [
                {extend: 'copy',className: 'btn-sm',text:'<i class="fa fa-copy"></i> Copier',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'csv',title: 'PADME WEB CONSOLE - Liste des utilisateurs', className: 'btn-sm',text:'<i class="fa fa-file-excel-o"></i> CSV',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'pdf', title: 'PADME WEB CONSOLE - Liste des utilisateurs', className: 'btn-sm',text:'<i class="fa fa-file-pdf-o"></i> PDF',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'print', title: 'PADME WEB CONSOLE - Liste des utilisateurs',className: 'btn-sm',text:'<i class="fa fa-print"></i> Imprimer',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	}
            ]
});

$('#userinactif_table').dataTable( {
            fnDrawCallback: function(settings, json) {
                    $.HSCore.components.HSDropdown.init($('[data-dropdown-target]'), {
                      dropdownHideOnScroll: false,
                      dropdownType: 'css-animation',
                      dropdownAnimationIn: 'fadeIn',
                      dropdownAnimationOut: 'fadeOut'
                    });

                    $('.aut_del').on('click', function (){
						var i = $(this).attr('i');
						var current_row = $(this).closest('tr');
						$.confirm({
						    title: 'Confirmer la mise en corbeille',
						    content: 'Cet auteur sera mis en corbeille',
						    buttons: {
						        confirm: {
						        	text: "OK",
						        	btnClass: 'btn-info',
						        	action : function () {
						        	    move_auteur(i,current_row);
						        	    $('#user_table').dataTable().fnDraw(false);
						        	}
						        },
						        cancel: {
						        	text: "Annuler",
						        	action : function () {
						        	    //$.alert('Confirmed!');
						        	}
						        }
						    }
						});
					});

					$('.aut_lien_statut').click(function (e){
						
						e.preventDefault();
						var i = $(this).attr('i');
						var s = $(this).attr('v');
						var statut_ui = $(this).closest('.d-inline-block').find('a.toggle');
						$.confirm({
						    title: 'Mise à jour du statut',
						    content: 'Confirmez-vous ce changement de statut?',
						    buttons: {
						        confirm: {
						        	text: "Oui",
						        	btnClass: 'btn-info',
						        	action : function () {
										show_loading();
										setTimeout(function(){ hide_loading(); }, 1000);
										//alert(ti);return;
										$url = base_url+'utilisateurs/changer_statut';
									    data = new FormData();
									    data.append("i", i);
									    data.append("s", s);       
									        $.ajax({
									           url: $url,
									           data: data,
									           cache: false,
									           contentType: false,
									           dataType:'JSON',
									           processData: false,
									           type: 'POST',
									            success: function(data){  
										           if (data.success) {
										           	$.alert({
									                    title: 'Mise à jour du statut',
									                    content: 'Le statut de l\'utilisateur a été correctement enregistré',
									                });
									                //update ui statut
									                $('#menu-toggle'+data.i).attr('style',data.statut)
									                $('#menu-toggle'+data.i).attr('title',data.t);
									                $('#user_table').dataTable().fnDraw(false);
									                //console.log(t)
									                //t.fnDraw(false);
										           }	           
										        },
									            error: function(jqXHR, textStatus, errorThrown) {
										           console.log(jqXHR.responseText+" "+errorThrown);
										        }
									        }); 
						        	}
						        },
						        cancel: {
						        	text: "Non",
						        	action : function () {
						        	    //$.alert('Confirmed!');
						        	}
						        }
						    }
						});
					})

					$('.lien_statut_pub').click(function (e){
						e.preventDefault();
						var i = $(this).attr('i');
						var d = $(this).prev('input[type=date]').val();
						var s = $(this).attr('v');
						var statut_ui = $(this).closest('.d-inline-block').find('a.toggle');
						//console.log(statut_ui);return;
						//alert("i:"+i+"//v:"+s+"//d:"+d);return;
						$.confirm({
						    title: 'Mise à jour du statut',
						    content: 'Confirmez-vous la publication de cette rubrique?',
						    buttons: {
						        confirm: {
						        	text: "Oui",
						        	btnClass: 'btn-info',
						        	action : function () {
						        	    //move_rubrique(i,current_row);
						        	    e.preventDefault();
										show_loading();
										setTimeout(function(){ hide_loading(); }, 1000);
										//alert(ti);return;
										$url = base_url+'rubriques/changer_statut';
									    data = new FormData();
									    data.append("i", i);
									    data.append("s", s);  
									    data.append("d", d);        
									        $.ajax({
									           url: $url,
									           data: data,
									           cache: false,
									           contentType: false,
									           dataType:'JSON',
									           processData: false,
									           type: 'POST',
									            success: function(data){  
										           if (data.success) {
										           	$.alert({
									                    title: 'Mise à jour du statut',
									                    content: 'Le statut de la rubrique a été correctement enregistré',
									                });
									                //update ui statut
									                $('#menu-toggle'+data.i).attr('style',data.statut)
									                $('#menu-toggle'+data.i).attr('title',data.t)
									                //statut_ui.html(data.statut)
										           }	           
										        },
									            error: function(jqXHR, textStatus, errorThrown) {
										           console.log(jqXHR.responseText+" "+errorThrown);
										        }
									        }); 
						        	}
						        },
						        cancel: {
						        	text: "Non",
						        	action : function () {
						        	    //$.alert('Confirmed!');
						        	}
						        }
						    }
						});
					})

                    $('[data-menu]').menu();


                    //alert( 'DataTables has finished its initialisation.' );
                  },
            processing:true,  
              serverSide:true,
              ajax:{  
                      url: base_url+"/utilisateurs/fetch_inactif",  
                      type:"POST"  ,
                      dataSrc:function(j){
                        //console.log(j);
                        $('.nbtable').html(j.recordsFiltered);
                       return j.data;
                      },
                      mRender: function (data, type, ab) {
                        if (ab == null) {
                             return ''; 
                        }
                      },

            },
            createdRow: function(row, data, index) {
                $('td', row).eq(0).addClass('js-select text-left g-first-child'); // 6 is index of column
			},
            aaSorting: [[ 0, "asc" ]],
            lengthMenu: [[10, 20, -1], [10, 20, "Tout"]],
            pageLength: 8,
            iDisplayLength:25,
            language: {
             "searchPlaceholder": "Recherche",
             "sProcessing":     "Recherche en cours...",
              "sSearch":         "",
              "sLengthMenu":     "Afficher _MENU_ &eacute;l&eacute;ments &nbsp;&nbsp;&nbsp;",
              "sInfo":           "_TOTAL_ élément(s) au total  ",
              "sInfoEmpty":      "Affichage de l'&eacute;l&eacute;ment 0 &agrave; 0 sur 0 &eacute;l&eacute;ment",
              "sInfoFiltered":   "(filtr&eacute; de _MAX_ &eacute;l&eacute;ments au total)",
              "sInfoPostFix":    "",
              "sLoadingRecords": "Chargement en cours...",
              "sZeroRecords":    "Aucun &eacute;l&eacute;ment &agrave; afficher",
              "sEmptyTable":     "Aucune donn&eacute;e disponible dans le tableau",
              "oPaginate": {            
                "sFirst":      "Premier",
                "sPrevious":   "<i class='hs-admin-angle-left'><i>",
                "sNext":       "<i class='hs-admin-angle-right'><i>",
                "sLast":       "Dernier"
              },
              "oAria": {
                "sSortAscending":  ": activer pour trier la colonne par ordre croissant",
                "sSortDescending": ": activer pour trier la colonne par ordre d&eacute;croissant"
              }
            },
            /*sDom:"<'form-control g-font-size-default g-brd-gray-dark-v7 g-brd-darkblue-v3--focus g-rounded-20 g-pl-20 g-pr-50 g-py-10'>lr",*/
            dom: "<'row'<'col-sm-4'l><'col-sm-4 text-center'B><'col-sm-4'f>>tp",
            "lengthMenu": [ [10, 25, 50, -1], [10, 25, 50, "Tout"] ],
            buttons: [
                {extend: 'copy',className: 'btn-sm',text:'<i class="fa fa-copy"></i> Copier',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'csv',title: 'PADME WEB CONSOLE - Liste des utilisateurs', className: 'btn-sm',text:'<i class="fa fa-file-excel-o"></i> CSV',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'pdf', title: 'PADME WEB CONSOLE - Liste des utilisateurs', className: 'btn-sm',text:'<i class="fa fa-file-pdf-o"></i> PDF',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'print', title: 'PADME WEB CONSOLE - Liste des utilisateurs',className: 'btn-sm',text:'<i class="fa fa-print"></i> Imprimer',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	}
            ]
});

$('#useractif_table').dataTable( {
            fnDrawCallback: function(settings, json) {
                    $.HSCore.components.HSDropdown.init($('[data-dropdown-target]'), {
                      dropdownHideOnScroll: false,
                      dropdownType: 'css-animation',
                      dropdownAnimationIn: 'fadeIn',
                      dropdownAnimationOut: 'fadeOut'
                    });

                    $('.aut_del').on('click', function (){
						var i = $(this).attr('i');
						var current_row = $(this).closest('tr');
						$.confirm({
						    title: 'Confirmer la mise en corbeille',
						    content: 'Cet auteur sera mis en corbeille',
						    buttons: {
						        confirm: {
						        	text: "OK",
						        	btnClass: 'btn-info',
						        	action : function () {
						        	    move_auteur(i,current_row);
						        	    $('#user_table').dataTable().fnDraw(false);
						        	}
						        },
						        cancel: {
						        	text: "Annuler",
						        	action : function () {
						        	    //$.alert('Confirmed!');
						        	}
						        }
						    }
						});
					});

					$('.aut_lien_statut').click(function (e){
						
						e.preventDefault();
						var i = $(this).attr('i');
						var s = $(this).attr('v');
						var statut_ui = $(this).closest('.d-inline-block').find('a.toggle');
						$.confirm({
						    title: 'Mise à jour du statut',
						    content: 'Confirmez-vous ce changement de statut?',
						    buttons: {
						        confirm: {
						        	text: "Oui",
						        	btnClass: 'btn-info',
						        	action : function () {
										show_loading();
										setTimeout(function(){ hide_loading(); }, 1000);
										//alert(ti);return;
										$url = base_url+'utilisateurs/changer_statut';
									    data = new FormData();
									    data.append("i", i);
									    data.append("s", s);       
									        $.ajax({
									           url: $url,
									           data: data,
									           cache: false,
									           contentType: false,
									           dataType:'JSON',
									           processData: false,
									           type: 'POST',
									            success: function(data){  
										           if (data.success) {
										           	$.alert({
									                    title: 'Mise à jour du statut',
									                    content: 'Le statut de l\'utilisateur a été correctement enregistré',
									                });
									                //update ui statut
									                $('#menu-toggle'+data.i).attr('style',data.statut)
									                $('#menu-toggle'+data.i).attr('title',data.t);
									                $('#user_table').dataTable().fnDraw(false);
									                //console.log(t)
									                //t.fnDraw(false);
										           }	           
										        },
									            error: function(jqXHR, textStatus, errorThrown) {
										           console.log(jqXHR.responseText+" "+errorThrown);
										        }
									        }); 
						        	}
						        },
						        cancel: {
						        	text: "Non",
						        	action : function () {
						        	    //$.alert('Confirmed!');
						        	}
						        }
						    }
						});
					})

					$('.lien_statut_pub').click(function (e){
						e.preventDefault();
						var i = $(this).attr('i');
						var d = $(this).prev('input[type=date]').val();
						var s = $(this).attr('v');
						var statut_ui = $(this).closest('.d-inline-block').find('a.toggle');
						//console.log(statut_ui);return;
						//alert("i:"+i+"//v:"+s+"//d:"+d);return;
						$.confirm({
						    title: 'Mise à jour du statut',
						    content: 'Confirmez-vous la publication de cette rubrique?',
						    buttons: {
						        confirm: {
						        	text: "Oui",
						        	btnClass: 'btn-info',
						        	action : function () {
						        	    //move_rubrique(i,current_row);
						        	    e.preventDefault();
										show_loading();
										setTimeout(function(){ hide_loading(); }, 1000);
										//alert(ti);return;
										$url = base_url+'rubriques/changer_statut';
									    data = new FormData();
									    data.append("i", i);
									    data.append("s", s);  
									    data.append("d", d);        
									        $.ajax({
									           url: $url,
									           data: data,
									           cache: false,
									           contentType: false,
									           dataType:'JSON',
									           processData: false,
									           type: 'POST',
									            success: function(data){  
										           if (data.success) {
										           	$.alert({
									                    title: 'Mise à jour du statut',
									                    content: 'Le statut de la rubrique a été correctement enregistré',
									                });
									                //update ui statut
									                $('#menu-toggle'+data.i).attr('style',data.statut)
									                $('#menu-toggle'+data.i).attr('title',data.t)
									                //statut_ui.html(data.statut)
										           }	           
										        },
									            error: function(jqXHR, textStatus, errorThrown) {
										           console.log(jqXHR.responseText+" "+errorThrown);
										        }
									        }); 
						        	}
						        },
						        cancel: {
						        	text: "Non",
						        	action : function () {
						        	    //$.alert('Confirmed!');
						        	}
						        }
						    }
						});
					})

                    $('[data-menu]').menu();


                    //alert( 'DataTables has finished its initialisation.' );
                  },
            processing:true,  
              serverSide:true,
              ajax:{  
                      url: base_url+"/utilisateurs/fetch_actif",  
                      type:"POST"  ,
                      dataSrc:function(j){
                        //console.log(j);
                        $('.nbtable').html(j.recordsFiltered);
                       return j.data;
                      },
                      mRender: function (data, type, ab) {
                        if (ab == null) {
                             return ''; 
                        }
                      },

            },
            createdRow: function(row, data, index) {
                $('td', row).eq(0).addClass('js-select text-left g-first-child'); // 6 is index of column
			},
            aaSorting: [[ 0, "asc" ]],
            lengthMenu: [[10, 20, -1], [10, 20, "Tout"]],
            pageLength: 8,
            iDisplayLength:25,
            language: {
             "searchPlaceholder": "Recherche",
             "sProcessing":     "Recherche en cours...",
              "sSearch":         "",
              "sLengthMenu":     "Afficher _MENU_ &eacute;l&eacute;ments &nbsp;&nbsp;&nbsp;",
              "sInfo":           "_TOTAL_ élément(s) au total  ",
              "sInfoEmpty":      "Affichage de l'&eacute;l&eacute;ment 0 &agrave; 0 sur 0 &eacute;l&eacute;ment",
              "sInfoFiltered":   "(filtr&eacute; de _MAX_ &eacute;l&eacute;ments au total)",
              "sInfoPostFix":    "",
              "sLoadingRecords": "Chargement en cours...",
              "sZeroRecords":    "Aucun &eacute;l&eacute;ment &agrave; afficher",
              "sEmptyTable":     "Aucune donn&eacute;e disponible dans le tableau",
              "oPaginate": {            
                "sFirst":      "Premier",
                "sPrevious":   "<i class='hs-admin-angle-left'><i>",
                "sNext":       "<i class='hs-admin-angle-right'><i>",
                "sLast":       "Dernier"
              },
              "oAria": {
                "sSortAscending":  ": activer pour trier la colonne par ordre croissant",
                "sSortDescending": ": activer pour trier la colonne par ordre d&eacute;croissant"
              }
            },
            /*sDom:"<'form-control g-font-size-default g-brd-gray-dark-v7 g-brd-darkblue-v3--focus g-rounded-20 g-pl-20 g-pr-50 g-py-10'>lr",*/
            dom: "<'row'<'col-sm-4'l><'col-sm-4 text-center'B><'col-sm-4'f>>tp",
            "lengthMenu": [ [10, 25, 50, -1], [10, 25, 50, "Tout"] ],
            buttons: [
                {extend: 'copy',className: 'btn-sm',text:'<i class="fa fa-copy"></i> Copier',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'csv',title: 'PADME WEB CONSOLE - Liste des utilisateurs', className: 'btn-sm',text:'<i class="fa fa-file-excel-o"></i> CSV',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'pdf', title: 'PADME WEB CONSOLE - Liste des utilisateurs', className: 'btn-sm',text:'<i class="fa fa-file-pdf-o"></i> PDF',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'print', title: 'PADME WEB CONSOLE - Liste des utilisateurs',className: 'btn-sm',text:'<i class="fa fa-print"></i> Imprimer',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	}
            ]
});

$('#groupe_table').dataTable( {
            fnDrawCallback: function(settings, json) {
                    $.HSCore.components.HSDropdown.init($('[data-dropdown-target]'), {
                      dropdownHideOnScroll: false,
                      dropdownType: 'css-animation',
                      dropdownAnimationIn: 'fadeIn',
                      dropdownAnimationOut: 'fadeOut'
                    });

                    $('.grp_hard_del').click(function (e){
                    	e.preventDefault();
						var i = $(this).attr('i');
						var current_row = $(this).closest('tr');
						$.confirm({
						    title: 'Cette opération est irréversible ',
						    content: 'Voulez-vous vraiment supprimer définitivement ce groupe de la base?',
						    buttons: {
						        confirm: {
						        	text: "OK",
						        	btnClass: 'btn-info',
						        	action : function () {
						        	    sup_groupe(i,current_row);
						        	}
						        },
						        cancel: {
						        	text: "Annuler",
						        	action : function () {
						        	    //$.alert('Confirmed!');
						        	}
						        }
						    }
						});
					})


					$('.lien_statut').click(function (e){
						
						e.preventDefault();
						var i = $(this).attr('i');
						var d = "";
						var s = $(this).attr('v');
						var statut_ui = $(this).closest('.d-inline-block').find('a.toggle');
						$.confirm({
						    title: 'Mise à jour du statut',
						    content: 'Confirmez-vous ce changement de statut?',
						    buttons: {
						        confirm: {
						        	text: "Oui",
						        	btnClass: 'btn-info',
						        	action : function () {
										show_loading();
										setTimeout(function(){ hide_loading(); }, 1000);
										//alert(ti);return;
										$url = base_url+'rubriques/changer_statut';
									    data = new FormData();
									    data.append("i", i);
									    data.append("s", s);  
									    data.append("d", d);        
									        $.ajax({
									           url: $url,
									           data: data,
									           cache: false,
									           contentType: false,
									           dataType:'JSON',
									           processData: false,
									           type: 'POST',
									            success: function(data){  
										           if (data.success) {
										           	$.alert({
									                    title: 'Mise à jour du statut',
									                    content: 'Le statut de la rubrique a été correctement enregistré',
									                });
									                //update ui statut
									                $('#menu-toggle'+data.i).attr('style',data.statut)
									                $('#menu-toggle'+data.i).attr('title',data.t)
										           }	           
										        },
									            error: function(jqXHR, textStatus, errorThrown) {
										           console.log(jqXHR.responseText+" "+errorThrown);
										        }
									        }); 
						        	}
						        },
						        cancel: {
						        	text: "Non",
						        	action : function () {
						        	    //$.alert('Confirmed!');
						        	}
						        }
						    }
						});
					})

					$('.lien_statut_pub').click(function (e){
						e.preventDefault();
						var i = $(this).attr('i');
						var d = $(this).prev('input[type=date]').val();
						var s = $(this).attr('v');
						var statut_ui = $(this).closest('.d-inline-block').find('a.toggle');
						//console.log(statut_ui);return;
						//alert("i:"+i+"//v:"+s+"//d:"+d);return;
						$.confirm({
						    title: 'Mise à jour du statut',
						    content: 'Confirmez-vous la publication de cette rubrique?',
						    buttons: {
						        confirm: {
						        	text: "Oui",
						        	btnClass: 'btn-info',
						        	action : function () {
						        	    //move_rubrique(i,current_row);
						        	    e.preventDefault();
										show_loading();
										setTimeout(function(){ hide_loading(); }, 1000);
										//alert(ti);return;
										$url = base_url+'rubriques/changer_statut';
									    data = new FormData();
									    data.append("i", i);
									    data.append("s", s);  
									    data.append("d", d);        
									        $.ajax({
									           url: $url,
									           data: data,
									           cache: false,
									           contentType: false,
									           dataType:'JSON',
									           processData: false,
									           type: 'POST',
									            success: function(data){  
										           if (data.success) {
										           	$.alert({
									                    title: 'Mise à jour du statut',
									                    content: 'Le statut de la rubrique a été correctement enregistré',
									                });
									                //update ui statut
									                $('#menu-toggle'+data.i).attr('style',data.statut)
									                $('#menu-toggle'+data.i).attr('title',data.t)
									                //statut_ui.html(data.statut)
										           }	           
										        },
									            error: function(jqXHR, textStatus, errorThrown) {
										           console.log(jqXHR.responseText+" "+errorThrown);
										        }
									        }); 
						        	}
						        },
						        cancel: {
						        	text: "Non",
						        	action : function () {
						        	    //$.alert('Confirmed!');
						        	}
						        }
						    }
						});
					})

                    $('[data-menu]').menu();


                    //alert( 'DataTables has finished its initialisation.' );
                  },
            processing:true,  
              serverSide:true,
              ajax:{  
                      url: base_url+"/groupes/fetch",  
                      type:"POST"  ,
                      dataSrc:function(j){
                        //console.log(j);
                        $('.nbtable').html(j.recordsFiltered);
                       return j.data;
                      },
                      mRender: function (data, type, ab) {
                        if (ab == null) {
                             return ''; 
                        }
                      },

            },
            createdRow: function(row, data, index) {
                $('td', row).eq(0).addClass('js-select text-left g-first-child'); // 6 is index of column
			},
            aaSorting: [[ 0, "asc" ]],
            lengthMenu: [[10, 20, -1], [10, 20, "Tout"]],
            pageLength: 8,
            iDisplayLength:25,
            language: {
             "searchPlaceholder": "Recherche",
             "sProcessing":     "Recherche en cours...",
              "sSearch":         "",
              "sLengthMenu":     "Afficher _MENU_ &eacute;l&eacute;ments &nbsp;&nbsp;&nbsp;",
              "sInfo":           "_TOTAL_ élément(s) au total  ",
              "sInfoEmpty":      "Affichage de l'&eacute;l&eacute;ment 0 &agrave; 0 sur 0 &eacute;l&eacute;ment",
              "sInfoFiltered":   "(filtr&eacute; de _MAX_ &eacute;l&eacute;ments au total)",
              "sInfoPostFix":    "",
              "sLoadingRecords": "Chargement en cours...",
              "sZeroRecords":    "Aucun &eacute;l&eacute;ment &agrave; afficher",
              "sEmptyTable":     "Aucune donn&eacute;e disponible dans le tableau",
              "oPaginate": {            
                "sFirst":      "Premier",
                "sPrevious":   "<i class='hs-admin-angle-left'><i>",
                "sNext":       "<i class='hs-admin-angle-right'><i>",
                "sLast":       "Dernier"
              },
              "oAria": {
                "sSortAscending":  ": activer pour trier la colonne par ordre croissant",
                "sSortDescending": ": activer pour trier la colonne par ordre d&eacute;croissant"
              }
            },
            /*sDom:"<'form-control g-font-size-default g-brd-gray-dark-v7 g-brd-darkblue-v3--focus g-rounded-20 g-pl-20 g-pr-50 g-py-10'>lr",*/
            dom: "<'row'<'col-sm-4'l><'col-sm-4 text-center'B><'col-sm-4'f>>tp",
            "lengthMenu": [ [10, 25, 50, -1], [10, 25, 50, "Tout"] ],
            buttons: [
                {extend: 'copy',className: 'btn-sm',text:'<i class="fa fa-copy"></i> Copier',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'csv',title: 'PADME WEB CONSOLE - Liste des groupes', className: 'btn-sm',text:'<i class="fa fa-file-excel-o"></i> CSV',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'pdf', title: 'PADME WEB CONSOLE - Liste des groupes', className: 'btn-sm',text:'<i class="fa fa-file-pdf-o"></i> PDF',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'print', title: 'PADME WEB CONSOLE - Liste des groupes',className: 'btn-sm',text:'<i class="fa fa-print"></i> Imprimer',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	}
            ]
});

function format_date(string_date){
	if(string_date){
		if(string_date.split(' ').length == 2){
			let date_parts1 = string_date.split(' '), date_parts2 = date_parts1[0].split('-');
			return date_parts2[2]+"/"+date_parts2[1]+"/"+date_parts2[0]+" "+date_parts1[1];
		}else{
			let date_parts = string_date.split('-');
			return date_parts[2]+"/"+date_parts[1]+"/"+date_parts[0];
		}
	} return '';
}

$('#mot_table').dataTable( {
            fnDrawCallback: function(settings, json) {
                    $.HSCore.components.HSDropdown.init($('[data-dropdown-target]'), {
                      dropdownHideOnScroll: false,
                      dropdownType: 'css-animation',
                      dropdownAnimationIn: 'fadeIn',
                      dropdownAnimationOut: 'fadeOut'
                    });

                    $('.mot_hard_del').click(function (e){
                    	e.preventDefault();
						var i = $(this).attr('i');
						var current_row = $(this).closest('tr');
						$.confirm({
						    title: 'Cette opération est irréversible ',
						    content: 'Voulez-vous vraiment supprimer définitivement ce mot-clé de la base?',
						    buttons: {
						        confirm: {
						        	text: "OK",
						        	btnClass: 'btn-info',
						        	action : function () {
						        	    sup_mot(i,current_row);
						        	}
						        },
						        cancel: {
						        	text: "Annuler",
						        	action : function () {
						        	    //$.alert('Confirmed!');
						        	}
						        }
						    }
						});
					})


                    $('[data-menu]').menu();

                  },
            processing:true,  
              serverSide:true,
              ajax:{  
                      url: base_url+"/mots/parcourir",  
                      type:"POST"  ,
                      dataSrc:function(j){
                        //console.log(j);
                        $('.nbtable').html(j.recordsFiltered);
                       return j.data;
                      },
                      mRender: function (data, type, ab) {
                        if (ab == null) {
                             return ''; 
                        }
                      },

            },
            createdRow: function(row, data, index) {
                $('td', row).eq(0).addClass('js-select text-left g-first-child'); // 6 is index of column
			},
            aaSorting: [[ 0, "desc" ]],
            lengthMenu: [[10, 20, -1], [10, 20, "Tout"]],
            pageLength: 8,
            iDisplayLength:25,
            language: {
             "searchPlaceholder": "Recherche",
             "sProcessing":     "Recherche en cours...",
              "sSearch":         "",
              "sLengthMenu":     "Afficher _MENU_ &eacute;l&eacute;ments &nbsp;&nbsp;&nbsp;",
              "sInfo":           "_TOTAL_ élément(s) au total  ",
              "sInfoEmpty":      "Affichage de l'&eacute;l&eacute;ment 0 &agrave; 0 sur 0 &eacute;l&eacute;ment",
              "sInfoFiltered":   "(filtr&eacute; de _MAX_ &eacute;l&eacute;ments au total)",
              "sInfoPostFix":    "",
              "sLoadingRecords": "Chargement en cours...",
              "sZeroRecords":    "Aucun &eacute;l&eacute;ment &agrave; afficher",
              "sEmptyTable":     "Aucune donn&eacute;e disponible dans le tableau",
              "oPaginate": {            
                "sFirst":      "Premier",
                "sPrevious":   "<i class='hs-admin-angle-left'><i>",
                "sNext":       "<i class='hs-admin-angle-right'><i>",
                "sLast":       "Dernier"
              },
              "oAria": {
                "sSortAscending":  ": activer pour trier la colonne par ordre croissant",
                "sSortDescending": ": activer pour trier la colonne par ordre d&eacute;croissant"
              }
            },
            /*sDom:"<'form-control g-font-size-default g-brd-gray-dark-v7 g-brd-darkblue-v3--focus g-rounded-20 g-pl-20 g-pr-50 g-py-10'>lr",*/
            dom: "<'row'<'col-sm-4'l><'col-sm-4 text-center'B><'col-sm-4'f>>tp",
            "lengthMenu": [ [10, 25, 50, -1], [10, 25, 50, "Tout"] ],
            buttons: [
                {extend: 'copy',className: 'btn-sm',text:'<i class="fa fa-copy"></i> Copier',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'csv',title: 'PADME WEB CONSOLE - Liste des mots clés', className: 'btn-sm',text:'<i class="fa fa-file-excel-o"></i> CSV',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'pdf', title: 'PADME WEB CONSOLE - Liste des mots clés', className: 'btn-sm',text:'<i class="fa fa-file-pdf-o"></i> PDF',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'print', title: 'PADME WEB CONSOLE - Liste des mots clés',className: 'btn-sm',text:'<i class="fa fa-print"></i> Imprimer',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	}
            ]
});


// services en ligne

$('#types_documents_table').dataTable( {
            fnDrawCallback: function(settings, json) {
                    $.HSCore.components.HSDropdown.init($('[data-dropdown-target]'), {
                      dropdownHideOnScroll: false,
                      dropdownType: 'css-animation',
                      dropdownAnimationIn: 'fadeIn',
                      dropdownAnimationOut: 'fadeOut'
                    });

                    $('.type_document_del').on('click', function (){
						var i = $(this).attr('i');
						var current_row = $(this).closest('tr');
						$.confirm({
						    title: 'Confirmer la suppression',
						    content: 'Cet type de document sera supprimé',
						    buttons: {
						        confirm: {
						        	text: "OK",
						        	btnClass: 'btn-info',
						        	action : function () {
						        	    delete_type_document(i,current_row);
						        	}
						        },
						        cancel: {
						        	text: "Annuler",
						        	action : function () {
						        	    //$.alert('Confirmed!');
						        	}
						        }
						    }
						});
					});
 

                    $('[data-menu]').menu();


                    //alert( 'DataTables has finished its initialisation.' );
                  },
            processing:true,  
              serverSide:true,
              ajax:{  
                      url: base_url+"/parametrage/types-documents/parcourir",  
                      type:"POST"  ,
                      dataSrc:function(j){
                      	console.log(j)
                        $('.nbtable').html(j.recordsFiltered);
                       return j.data;
                      },
                      mRender: function (data, type, ab) {
                        if (ab == null) {
                             return ''; 
                        }
                      },

            },
            createdRow: function(row, data, index) {
                $('td', row).eq(0).addClass('js-select text-left g-first-child'); // 6 is index of column
			},
            aaSorting: [[ 0, "desc" ]],
            lengthMenu: [[10, 20, -1], [10, 20, "Tout"]],
            pageLength: 8,
            iDisplayLength:25,
            language: {
             "searchPlaceholder": "Recherche",
             "sProcessing":     "Recherche en cours...",
              "sSearch":         "",
              "sLengthMenu":     "Afficher _MENU_ &eacute;l&eacute;ments &nbsp;&nbsp;&nbsp;",
              "sInfo":           "_TOTAL_ élément(s) au total  ",
              "sInfoEmpty":      "Affichage de l'&eacute;l&eacute;ment 0 &agrave; 0 sur 0 &eacute;l&eacute;ment",
              "sInfoFiltered":   "(filtr&eacute; de _MAX_ &eacute;l&eacute;ments au total)",
              "sInfoPostFix":    "",
              "sLoadingRecords": "Chargement en cours...",
              "sZeroRecords":    "Aucun &eacute;l&eacute;ment &agrave; afficher",
              "sEmptyTable":     "Aucune donn&eacute;e disponible dans le tableau",
              "oPaginate": {            
                "sFirst":      "Premier",
                "sPrevious":   "<i class='hs-admin-angle-left'><i>",
                "sNext":       "<i class='hs-admin-angle-right'><i>",
                "sLast":       "Dernier"
              },
              "oAria": {
                "sSortAscending":  ": activer pour trier la colonne par ordre croissant",
                "sSortDescending": ": activer pour trier la colonne par ordre d&eacute;croissant"
              }
            },
            /*sDom:"<'form-control g-font-size-default g-brd-gray-dark-v7 g-brd-darkblue-v3--focus g-rounded-20 g-pl-20 g-pr-50 g-py-10'>lr",*/
            dom: "<'row'<'col-sm-4'l><'col-sm-4 text-center'B><'col-sm-4'f>>tp",
            "lengthMenu": [ [10, 25, 50, -1], [10, 25, 50, "Tout"] ],
            buttons: [
                {extend: 'copy',className: 'btn-sm',text:'<i class="fa fa-copy"></i> Copier',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'csv',title: 'IFSIO WEB CONSOLE - Liste des types de documents', className: 'btn-sm',text:'<i class="fa fa-file-excel-o"></i> CSV',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'pdf', title: 'IFSIO WEB CONSOLE - Liste des types de documents', className: 'btn-sm',text:'<i class="fa fa-file-pdf-o"></i> PDF',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'print', title: 'IFSIO WEB CONSOLE - Liste des types de documents',className: 'btn-sm',text:'<i class="fa fa-print"></i> Imprimer',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	}
            ]
});


$('#filieres_table').dataTable( {
            fnDrawCallback: function(settings, json) {
                    $.HSCore.components.HSDropdown.init($('[data-dropdown-target]'), {
                      dropdownHideOnScroll: false,
                      dropdownType: 'css-animation',
                      dropdownAnimationIn: 'fadeIn',
                      dropdownAnimationOut: 'fadeOut'
                    });

                    $('.filiere_del').on('click', function (){
						var i = $(this).attr('i');
						var current_row = $(this).closest('tr');
						$.confirm({
						    title: 'Confirmer la suppression',
						    content: 'Cette filière sera supprimée',
						    buttons: {
						        confirm: {
						        	text: "OK",
						        	btnClass: 'btn-info',
						        	action : function () {
						        	    delete_filiere(i,current_row);
						        	}
						        },
						        cancel: {
						        	text: "Annuler",
						        	action : function () {
						        	    //$.alert('Confirmed!');
						        	}
						        }
						    }
						});
					});
 

                    $('[data-menu]').menu();


                    //alert( 'DataTables has finished its initialisation.' );
                  },
            processing:true,  
              serverSide:true,
              ajax:{  
                      url: base_url+"/parametrage/filieres/parcourir",  
                      type:"POST"  ,
                      dataSrc:function(j){
                      	console.log(j)
                        $('.nbtable').html(j.recordsFiltered);
                       return j.data;
                      },
                      mRender: function (data, type, ab) {
                        if (ab == null) {
                             return ''; 
                        }
                      },

            },
            createdRow: function(row, data, index) {
                $('td', row).eq(0).addClass('js-select text-left g-first-child'); // 6 is index of column
			},
            aaSorting: [[ 0, "desc" ]],
            lengthMenu: [[10, 20, -1], [10, 20, "Tout"]],
            pageLength: 8,
            iDisplayLength:25,
            language: {
             "searchPlaceholder": "Recherche",
             "sProcessing":     "Recherche en cours...",
              "sSearch":         "",
              "sLengthMenu":     "Afficher _MENU_ &eacute;l&eacute;ments &nbsp;&nbsp;&nbsp;",
              "sInfo":           "_TOTAL_ élément(s) au total  ",
              "sInfoEmpty":      "Affichage de l'&eacute;l&eacute;ment 0 &agrave; 0 sur 0 &eacute;l&eacute;ment",
              "sInfoFiltered":   "(filtr&eacute; de _MAX_ &eacute;l&eacute;ments au total)",
              "sInfoPostFix":    "",
              "sLoadingRecords": "Chargement en cours...",
              "sZeroRecords":    "Aucun &eacute;l&eacute;ment &agrave; afficher",
              "sEmptyTable":     "Aucune donn&eacute;e disponible dans le tableau",
              "oPaginate": {            
                "sFirst":      "Premier",
                "sPrevious":   "<i class='hs-admin-angle-left'><i>",
                "sNext":       "<i class='hs-admin-angle-right'><i>",
                "sLast":       "Dernier"
              },
              "oAria": {
                "sSortAscending":  ": activer pour trier la colonne par ordre croissant",
                "sSortDescending": ": activer pour trier la colonne par ordre d&eacute;croissant"
              }
            },
            /*sDom:"<'form-control g-font-size-default g-brd-gray-dark-v7 g-brd-darkblue-v3--focus g-rounded-20 g-pl-20 g-pr-50 g-py-10'>lr",*/
            dom: "<'row'<'col-sm-4'l><'col-sm-4 text-center'B><'col-sm-4'f>>tp",
            "lengthMenu": [ [10, 25, 50, -1], [10, 25, 50, "Tout"] ],
            buttons: [
                {extend: 'copy',className: 'btn-sm',text:'<i class="fa fa-copy"></i> Copier',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'csv',title: 'IFSIO WEB CONSOLE - Liste des filières', className: 'btn-sm',text:'<i class="fa fa-file-excel-o"></i> CSV',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'pdf', title: 'IFSIO WEB CONSOLE - Liste des filières', className: 'btn-sm',text:'<i class="fa fa-file-pdf-o"></i> PDF',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'print', title: 'IFSIO WEB CONSOLE - Liste des filières',className: 'btn-sm',text:'<i class="fa fa-print"></i> Imprimer',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	}
            ]
});

$('#annees_academiques_table').dataTable( {
            fnDrawCallback: function(settings, json) {
                    $.HSCore.components.HSDropdown.init($('[data-dropdown-target]'), {
                      dropdownHideOnScroll: false,
                      dropdownType: 'css-animation',
                      dropdownAnimationIn: 'fadeIn',
                      dropdownAnimationOut: 'fadeOut'
                    });

                    $('.annee_academique_del').on('click', function (){
						var i = $(this).attr('i');
						var current_row = $(this).closest('tr');
						$.confirm({
						    title: 'Confirmer la suppression',
						    content: 'Cette année académique sera supprimée',
						    buttons: {
						        confirm: {
						        	text: "OK",
						        	btnClass: 'btn-info',
						        	action : function () {
						        	    delete_annee_academique(i,current_row);
						        	}
						        },
						        cancel: {
						        	text: "Annuler",
						        	action : function () {
						        	    //$.alert('Confirmed!');
						        	}
						        }
						    }
						});
					});
 

                    $('[data-menu]').menu();


                    //alert( 'DataTables has finished its initialisation.' );
                  },
            processing:true,  
              serverSide:true,
              ajax:{  
                      url: base_url+"/parametrage/donnees/academiques/parcourir",  
                      type:"POST"  ,
                      dataSrc:function(j){
                      	console.log(j)
                        $('.nbtable').html(j.recordsFiltered);
                       return j.data;
                      },
                      mRender: function (data, type, ab) {
                        if (ab == null) {
                             return ''; 
                        }
                      },

            },
            createdRow: function(row, data, index) {
                $('td', row).eq(0).addClass('js-select text-left g-first-child'); // 6 is index of column
			},
            aaSorting: [[ 0, "desc" ]],
            lengthMenu: [[10, 20, -1], [10, 20, "Tout"]],
            pageLength: 8,
            iDisplayLength:25,
            language: {
             "searchPlaceholder": "Recherche",
             "sProcessing":     "Recherche en cours...",
              "sSearch":         "",
              "sLengthMenu":     "Afficher _MENU_ &eacute;l&eacute;ments &nbsp;&nbsp;&nbsp;",
              "sInfo":           "_TOTAL_ élément(s) au total  ",
              "sInfoEmpty":      "Affichage de l'&eacute;l&eacute;ment 0 &agrave; 0 sur 0 &eacute;l&eacute;ment",
              "sInfoFiltered":   "(filtr&eacute; de _MAX_ &eacute;l&eacute;ments au total)",
              "sInfoPostFix":    "",
              "sLoadingRecords": "Chargement en cours...",
              "sZeroRecords":    "Aucun &eacute;l&eacute;ment &agrave; afficher",
              "sEmptyTable":     "Aucune donn&eacute;e disponible dans le tableau",
              "oPaginate": {            
                "sFirst":      "Premier",
                "sPrevious":   "<i class='hs-admin-angle-left'><i>",
                "sNext":       "<i class='hs-admin-angle-right'><i>",
                "sLast":       "Dernier"
              },
              "oAria": {
                "sSortAscending":  ": activer pour trier la colonne par ordre croissant",
                "sSortDescending": ": activer pour trier la colonne par ordre d&eacute;croissant"
              }
            },
            /*sDom:"<'form-control g-font-size-default g-brd-gray-dark-v7 g-brd-darkblue-v3--focus g-rounded-20 g-pl-20 g-pr-50 g-py-10'>lr",*/
            dom: "<'row'<'col-sm-4'l><'col-sm-4 text-center'B><'col-sm-4'f>>tp",
            "lengthMenu": [ [10, 25, 50, -1], [10, 25, 50, "Tout"] ],
            buttons: [
                {extend: 'copy',className: 'btn-sm',text:'<i class="fa fa-copy"></i> Copier',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'csv',title: 'IFSIO WEB CONSOLE - Liste des filières', className: 'btn-sm',text:'<i class="fa fa-file-excel-o"></i> CSV',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'pdf', title: 'IFSIO WEB CONSOLE - Liste des filières', className: 'btn-sm',text:'<i class="fa fa-file-pdf-o"></i> PDF',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'print', title: 'IFSIO WEB CONSOLE - Liste des filières',className: 'btn-sm',text:'<i class="fa fa-print"></i> Imprimer',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	}
            ]
});




$('#administrer_parcours_table').dataTable( {
            fnDrawCallback: function(settings, json) {
                    $.HSCore.components.HSDropdown.init($('[data-dropdown-target]'), {
                      dropdownHideOnScroll: false,
                      dropdownType: 'css-animation',
                      dropdownAnimationIn: 'fadeIn',
                      dropdownAnimationOut: 'fadeOut'
                    });
 

                    $('.parcours_observations').on('click', function (e){
						e.preventDefault()
						// $("input[name=]").trigger('click')
						// alert('f')
						var i = $(this).attr('i');
						var a = $(this).attr('a');
						var f = $(this).attr('f');
						var e = $(this).attr('e');
						var o = $(this).attr('o');
						$(".lbl_annee").text(a+" en "+f)
						$(".lbl_etudiant").text(e)
						$("input[name=p_i]").val(i);
						$("textarea[name=parcours_observations]").val(o);

						$("#modal_parcours_observations_btn").trigger('click')
					});


					$('.parcours_validations').on('click', function (e){
						e.preventDefault()

						$(".saisie_nom").removeClass("error")						
						$(".saisie_prenoms").removeClass("error")
						$(".saisie_diplome").removeClass("error")
						$(".saisie_filiere").removeClass("error")
						// $("input[name=]").trigger('click')
						// alert('f')
						var i = $(this).attr('i');
						var a = $(this).attr('a');
						var e = $(this).attr('e');
						var em = $(this).attr('em');
						var n = $(this).attr('n');
						var p = $(this).attr('p');
						var f = $(this).attr('f');
						var d = $(this).attr('d');

						var exist_n = $(this).attr('exist_n');
						var exist_p = $(this).attr('exist_p');
						var exist_f = $(this).attr('exist_f');
						var exist_d = $(this).attr('exist_d');

						var o = $(this).attr('o');
						$(".lbl_annee").text(a+" en "+f)
						$(".lbl_etudiant").text(e)
						$("input[name=p_i]").val(i);
						$("textarea[name=parcours_observations]").val(o);

						$(".saisie_email").text(em)
						$(".saisie_nom").text(n)
						$(".saisie_prenoms").text(p)
						$(".saisie_diplome").text(d)
						$(".saisie_filiere").text(f)


						$(".existant_nom").text(exist_n)
						$(".existant_prenoms").text(exist_p)
						$(".existant_diplome").text(exist_d)
						$(".existant_filiere").text(exist_f)

						if (exist_n!=n) {
							$(".saisie_nom").addClass("error")
						}
						if (exist_p!=p) {
							$(".saisie_prenoms").addClass("error")
						}
						if (exist_d!=d) {
							$(".saisie_diplome").addClass("error")
						}
						if (exist_f!=f) {
							$(".saisie_filiere").addClass("error")
						}

						$(".lbl_etudiant").text(e)

						$("#modal_parcours_validations_btn").trigger('click')
					});

					
					

 

                    $('[data-menu]').menu();


                    //alert( 'DataTables has finished its initialisation.' );
                  },
            processing:true,  
              serverSide:true,
              ajax:{  
                      url: base_url+"/services/parcourir_administrer_parcours",  
                      type:"POST"  ,
                      dataSrc:function(j){
                      	console.log(j)
                        $('.nbtable').html(j.recordsFiltered);
                       return j.data;
                      },
                      mRender: function (data, type, ab) {
                        if (ab == null) {
                             return ''; 
                        }
                      },

            },
            createdRow: function(row, data, index) {
                $('td', row).eq(0).addClass('js-select text-left g-first-child'); // 6 is index of column
			},
            aaSorting: [[ 0, "desc" ]],
            lengthMenu: [[10, 20, -1], [10, 20, "Tout"]],
            pageLength: 8,
            iDisplayLength:25,
            language: {
             "searchPlaceholder": "Recherche",
             "sProcessing":     "Recherche en cours...",
              "sSearch":         "",
              "sLengthMenu":     "Afficher _MENU_ &eacute;l&eacute;ments &nbsp;&nbsp;&nbsp;",
              "sInfo":           "_TOTAL_ élément(s) au total  ",
              "sInfoEmpty":      "Affichage de l'&eacute;l&eacute;ment 0 &agrave; 0 sur 0 &eacute;l&eacute;ment",
              "sInfoFiltered":   "(filtr&eacute; de _MAX_ &eacute;l&eacute;ments au total)",
              "sInfoPostFix":    "",
              "sLoadingRecords": "Chargement en cours...",
              "sZeroRecords":    "Aucun &eacute;l&eacute;ment &agrave; afficher",
              "sEmptyTable":     "Aucune donn&eacute;e disponible dans le tableau",
              "oPaginate": {            
                "sFirst":      "Premier",
                "sPrevious":   "<i class='hs-admin-angle-left'><i>",
                "sNext":       "<i class='hs-admin-angle-right'><i>",
                "sLast":       "Dernier"
              },
              "oAria": {
                "sSortAscending":  ": activer pour trier la colonne par ordre croissant",
                "sSortDescending": ": activer pour trier la colonne par ordre d&eacute;croissant"
              }
            },
            columnDefs: [{ visible: false, targets: 6 }, { visible: false, targets: 7 }],
            /*sDom:"<'form-control g-font-size-default g-brd-gray-dark-v7 g-brd-darkblue-v3--focus g-rounded-20 g-pl-20 g-pr-50 g-py-10'>lr",*/
            dom: "<'row'<'col-sm-4'l><'col-sm-4 text-center'B><'col-sm-4'f>>tp",
            "lengthMenu": [ [10, 25, 50, -1], [10, 25, 50, "Tout"] ],
            buttons: [
            	{extend: 'colvis',className: 'btn-sm',text:'<i class="fa fa-eye"></i> Visibilité',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'copy',className: 'btn-sm',text:'<i class="fa fa-copy"></i> Copier',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'csv',title: 'IFSIO WEB CONSOLE - Liste des parcours', className: 'btn-sm',text:'<i class="fa fa-file-excel-o"></i> CSV',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'pdf', title: 'IFSIO WEB CONSOLE - Liste des parcours', className: 'btn-sm',text:'<i class="fa fa-file-pdf-o"></i> PDF',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'print', title: 'IFSIO WEB CONSOLE - Liste des parcours',className: 'btn-sm',text:'<i class="fa fa-print"></i> Imprimer',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	}
            ]
});


$('#administrer_classes_table').dataTable( {
            fnDrawCallback: function(settings, json) {
                    $.HSCore.components.HSDropdown.init($('[data-dropdown-target]'), {
                      dropdownHideOnScroll: false,
                      dropdownType: 'css-animation',
                      dropdownAnimationIn: 'fadeIn',
                      dropdownAnimationOut: 'fadeOut'
                    });
 


					$('.classe_approuver').on('click', function (e){ 
				      e.preventDefault()
				      // alert('g')
				      var h= $(this).attr('h')
				      $.confirm({
				         title: 'Confirmer l\'approbation de cette demande',
				         content: 'Cette demande de classe sera approuvée',
				         buttons: {
				             confirm: {
				               text: "OK",
				               btnClass: 'btn-info',
				               action : function () {
				                   // delete_filiere(i,current_row);
				                // alert('approuvée') 
				                location.href=h
				               }
				             },
				             cancel: {
				               text: "Annuler",
				               action : function () {
				                   //$.alert('Confirmed!');
				               }
				             }
				         }
				      });
				    })

                    $('.classe_observations').on('click', function (e){
						e.preventDefault()
						// $("input[name=]").trigger('click')
						// alert('f')
						var i = $(this).attr('i');
						var a = $(this).attr('a');
						var f = $(this).attr('f');
						var e = $(this).attr('e');
						var o = $(this).attr('o');
						$(".lbl_annee").text(a+" en "+f)
						$(".lbl_etudiant").text(e)
						$("input[name=p_i]").val(i);
						$("textarea[name=parcours_observations]").val(o);

						$("#modal_classes_observations_btn").trigger('click')
					});


					$('.classe_rejeter').on('click', function (e){
                    	e.preventDefault()

                    	var i = $(this).attr('i');
						var a = $(this).attr('a');
						var f = $(this).attr('f');
						var e = $(this).attr('e');
						var c = $(this).attr('c');
						$(".lbl_annee").text(a+" en "+f)
						$(".lbl_etudiant").text(e)
						$("input[name=p_i]").val(i);
						$("textarea[name=classe_commentaires]").val(c);

						$("#modal_classes_motif_btn").trigger('click')

                    })

 
					
					

 

                    $('[data-menu]').menu();


                    //alert( 'DataTables has finished its initialisation.' );
                  },
            processing:true,  
              serverSide:true,
              ajax:{  
                      url: base_url+"/services/parcourir_administrer_classes",  
                      type:"POST"  ,
                      dataSrc:function(j){
                      	console.log(j)
                        $('.nbtable').html(j.recordsFiltered);
                       return j.data;
                      },
                      mRender: function (data, type, ab) {
                        if (ab == null) {
                             return ''; 
                        }
                      },

            },
            createdRow: function(row, data, index) {
                $('td', row).eq(0).addClass('js-select text-left g-first-child'); // 6 is index of column
			},
            aaSorting: [[ 0, "desc" ]],
            lengthMenu: [[10, 20, -1], [10, 20, "Tout"]],
            pageLength: 8,
            iDisplayLength:25,
            language: {
             "searchPlaceholder": "Recherche",
             "sProcessing":     "Recherche en cours...",
              "sSearch":         "",
              "sLengthMenu":     "Afficher _MENU_ &eacute;l&eacute;ments &nbsp;&nbsp;&nbsp;",
              "sInfo":           "_TOTAL_ élément(s) au total  ",
              "sInfoEmpty":      "Affichage de l'&eacute;l&eacute;ment 0 &agrave; 0 sur 0 &eacute;l&eacute;ment",
              "sInfoFiltered":   "(filtr&eacute; de _MAX_ &eacute;l&eacute;ments au total)",
              "sInfoPostFix":    "",
              "sLoadingRecords": "Chargement en cours...",
              "sZeroRecords":    "Aucun &eacute;l&eacute;ment &agrave; afficher",
              "sEmptyTable":     "Aucune donn&eacute;e disponible dans le tableau",
              "oPaginate": {            
                "sFirst":      "Premier",
                "sPrevious":   "<i class='hs-admin-angle-left'><i>",
                "sNext":       "<i class='hs-admin-angle-right'><i>",
                "sLast":       "Dernier"
              },
              "oAria": {
                "sSortAscending":  ": activer pour trier la colonne par ordre croissant",
                "sSortDescending": ": activer pour trier la colonne par ordre d&eacute;croissant"
              }
            },
            columnDefs: [{ visible: false, targets: 6 }],
            /*sDom:"<'form-control g-font-size-default g-brd-gray-dark-v7 g-brd-darkblue-v3--focus g-rounded-20 g-pl-20 g-pr-50 g-py-10'>lr",*/
            dom: "<'row'<'col-sm-4'l><'col-sm-4 text-center'B><'col-sm-4'f>>tp",
            "lengthMenu": [ [10, 25, 50, -1], [10, 25, 50, "Tout"] ],
            buttons: [
            	{extend: 'colvis',className: 'btn-sm',text:'<i class="fa fa-eye"></i> Visibilité',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'copy',className: 'btn-sm',text:'<i class="fa fa-copy"></i> Copier',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'csv',title: 'IFSIO WEB CONSOLE - Liste des parcours', className: 'btn-sm',text:'<i class="fa fa-file-excel-o"></i> CSV',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'pdf', title: 'IFSIO WEB CONSOLE - Liste des parcours', className: 'btn-sm',text:'<i class="fa fa-file-pdf-o"></i> PDF',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'print', title: 'IFSIO WEB CONSOLE - Liste des parcours',className: 'btn-sm',text:'<i class="fa fa-print"></i> Imprimer',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	}
            ]
});

 
$('#parcours_table').dataTable( {
            fnDrawCallback: function(settings, json) {
                    $.HSCore.components.HSDropdown.init($('[data-dropdown-target]'), {
                      dropdownHideOnScroll: false,
                      dropdownType: 'css-animation',
                      dropdownAnimationIn: 'fadeIn',
                      dropdownAnimationOut: 'fadeOut'
                    });

                    // $('.parcours_del').on('click', function (){
					// 	var i = $(this).attr('i');
					// 	var current_row = $(this).closest('tr');
					// 	$.confirm({
					// 	    title: 'Confirmer la suppression',
					// 	    content: 'Cette filière sera supprimée',
					// 	    buttons: {
					// 	        confirm: {
					// 	        	text: "OK",
					// 	        	btnClass: 'btn-info',
					// 	        	action : function () {
					// 	        	    delete_filiere(i,current_row);
					// 	        	}
					// 	        },
					// 	        cancel: {
					// 	        	text: "Annuler",
					// 	        	action : function () {
					// 	        	    //$.alert('Confirmed!');
					// 	        	}
					// 	        }
					// 	    }
					// 	});
					// });
 

                    $('[data-menu]').menu();


                    //alert( 'DataTables has finished its initialisation.' );
                  },
            processing:true,  
              serverSide:true,
              ajax:{  
                      url: base_url+"/services/parcourir_parcours",  
                      type:"POST"  ,
                      dataSrc:function(j){
                      	console.log(j)
                        $('.nbtable').html(j.recordsFiltered);
                       return j.data;
                      },
                      mRender: function (data, type, ab) {
                        if (ab == null) {
                             return ''; 
                        }
                      },

            },
            createdRow: function(row, data, index) {
                $('td', row).eq(0).addClass('js-select text-left g-first-child'); // 6 is index of column
			},
            aaSorting: [[ 0, "desc" ]],
            lengthMenu: [[10, 20, -1], [10, 20, "Tout"]],
            pageLength: 8,
            iDisplayLength:25,
            language: {
             "searchPlaceholder": "Recherche",
             "sProcessing":     "Recherche en cours...",
              "sSearch":         "",
              "sLengthMenu":     "Afficher _MENU_ &eacute;l&eacute;ments &nbsp;&nbsp;&nbsp;",
              "sInfo":           "_TOTAL_ élément(s) au total  ",
              "sInfoEmpty":      "Affichage de l'&eacute;l&eacute;ment 0 &agrave; 0 sur 0 &eacute;l&eacute;ment",
              "sInfoFiltered":   "(filtr&eacute; de _MAX_ &eacute;l&eacute;ments au total)",
              "sInfoPostFix":    "",
              "sLoadingRecords": "Chargement en cours...",
              "sZeroRecords":    "Aucun &eacute;l&eacute;ment &agrave; afficher",
              "sEmptyTable":     "Aucune donn&eacute;e disponible dans le tableau",
              "oPaginate": {            
                "sFirst":      "Premier",
                "sPrevious":   "<i class='hs-admin-angle-left'><i>",
                "sNext":       "<i class='hs-admin-angle-right'><i>",
                "sLast":       "Dernier"
              },
              "oAria": {
                "sSortAscending":  ": activer pour trier la colonne par ordre croissant",
                "sSortDescending": ": activer pour trier la colonne par ordre d&eacute;croissant"
              }
            },
            columnDefs: [{ visible: false, targets: 6 }],
            /*sDom:"<'form-control g-font-size-default g-brd-gray-dark-v7 g-brd-darkblue-v3--focus g-rounded-20 g-pl-20 g-pr-50 g-py-10'>lr",*/
            dom: "<'row'<'col-sm-4'l><'col-sm-4 text-center'B><'col-sm-4'f>>tp",
            "lengthMenu": [ [10, 25, 50, -1], [10, 25, 50, "Tout"] ],
            buttons: [
            	{extend: 'colvis',className: 'btn-sm',text:'<i class="fa fa-eye"></i> Visibilité',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'copy',className: 'btn-sm',text:'<i class="fa fa-copy"></i> Copier',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'csv',title: 'IFSIO WEB CONSOLE - Liste des parcours', className: 'btn-sm',text:'<i class="fa fa-file-excel-o"></i> CSV',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'pdf', title: 'IFSIO WEB CONSOLE - Liste des parcours', className: 'btn-sm',text:'<i class="fa fa-file-pdf-o"></i> PDF',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'print', title: 'IFSIO WEB CONSOLE - Liste des parcours',className: 'btn-sm',text:'<i class="fa fa-print"></i> Imprimer',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	}
            ]
});

$('#demandes_documents_table').dataTable( {
            fnDrawCallback: function(settings, json) {
                    $.HSCore.components.HSDropdown.init($('[data-dropdown-target]'), {
                      dropdownHideOnScroll: false,
                      dropdownType: 'css-animation',
                      dropdownAnimationIn: 'fadeIn',
                      dropdownAnimationOut: 'fadeOut'
                    });

                    // $('.parcours_del').on('click', function (){
					// 	var i = $(this).attr('i');
					// 	var current_row = $(this).closest('tr');
					// 	$.confirm({
					// 	    title: 'Confirmer la suppression',
					// 	    content: 'Cette filière sera supprimée',
					// 	    buttons: {
					// 	        confirm: {
					// 	        	text: "OK",
					// 	        	btnClass: 'btn-info',
					// 	        	action : function () {
					// 	        	    delete_filiere(i,current_row);
					// 	        	}
					// 	        },
					// 	        cancel: {
					// 	        	text: "Annuler",
					// 	        	action : function () {
					// 	        	    //$.alert('Confirmed!');
					// 	        	}
					// 	        }
					// 	    }
					// 	});
					// });
 

                    $('[data-menu]').menu();


                    //alert( 'DataTables has finished its initialisation.' );
                  },
            processing:true,  
              serverSide:true,
              ajax:{  
                      url: base_url+"/services/parcourir_documents/1",  
                      type:"POST"  ,
                      dataSrc:function(j){
                      	console.log(j)
                        $('.nbtable').html(j.recordsFiltered);
                       return j.data;
                      },
                      mRender: function (data, type, ab) {
                        if (ab == null) {
                             return ''; 
                        }
                      },

            },
            createdRow: function(row, data, index) {
                $('td', row).eq(0).addClass('js-select text-left g-first-child'); // 6 is index of column
			},
            aaSorting: [[ 0, "desc" ]],
            lengthMenu: [[10, 20, -1], [10, 20, "Tout"]],
            pageLength: 8,
            iDisplayLength:25,
            language: {
             "searchPlaceholder": "Recherche",
             "sProcessing":     "Recherche en cours...",
              "sSearch":         "",
              "sLengthMenu":     "Afficher _MENU_ &eacute;l&eacute;ments &nbsp;&nbsp;&nbsp;",
              "sInfo":           "_TOTAL_ élément(s) au total  ",
              "sInfoEmpty":      "Affichage de l'&eacute;l&eacute;ment 0 &agrave; 0 sur 0 &eacute;l&eacute;ment",
              "sInfoFiltered":   "(filtr&eacute; de _MAX_ &eacute;l&eacute;ments au total)",
              "sInfoPostFix":    "",
              "sLoadingRecords": "Chargement en cours...",
              "sZeroRecords":    "Aucun &eacute;l&eacute;ment &agrave; afficher",
              "sEmptyTable":     "Aucune donn&eacute;e disponible dans le tableau",
              "oPaginate": {            
                "sFirst":      "Premier",
                "sPrevious":   "<i class='hs-admin-angle-left'><i>",
                "sNext":       "<i class='hs-admin-angle-right'><i>",
                "sLast":       "Dernier"
              },
              "oAria": {
                "sSortAscending":  ": activer pour trier la colonne par ordre croissant",
                "sSortDescending": ": activer pour trier la colonne par ordre d&eacute;croissant"
              }
            },
            // columnDefs: [{ visible: false, targets: 3 }],
            /*sDom:"<'form-control g-font-size-default g-brd-gray-dark-v7 g-brd-darkblue-v3--focus g-rounded-20 g-pl-20 g-pr-50 g-py-10'>lr",*/
            dom: "<'row'<'col-sm-4'l><'col-sm-4 text-center'B><'col-sm-4'f>>tp",
            "lengthMenu": [ [10, 25, 50, -1], [10, 25, 50, "Tout"] ],
            buttons: [
            	{extend: 'colvis',className: 'btn-sm',text:'<i class="fa fa-eye"></i> Visibilité',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'copy',className: 'btn-sm',text:'<i class="fa fa-copy"></i> Copier',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'csv',title: 'IFSIO WEB CONSOLE - Liste des documents', className: 'btn-sm',text:'<i class="fa fa-file-excel-o"></i> CSV',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'pdf', title: 'IFSIO WEB CONSOLE - Liste des documents', className: 'btn-sm',text:'<i class="fa fa-file-pdf-o"></i> PDF',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'print', title: 'IFSIO WEB CONSOLE - Liste des documents',className: 'btn-sm',text:'<i class="fa fa-print"></i> Imprimer',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	}
            ]
});


$('#demandes_documents_clotures_table').dataTable( {
            fnDrawCallback: function(settings, json) {
                    $.HSCore.components.HSDropdown.init($('[data-dropdown-target]'), {
                      dropdownHideOnScroll: false,
                      dropdownType: 'css-animation',
                      dropdownAnimationIn: 'fadeIn',
                      dropdownAnimationOut: 'fadeOut'
                    });

                    // $('.parcours_del').on('click', function (){
					// 	var i = $(this).attr('i');
					// 	var current_row = $(this).closest('tr');
					// 	$.confirm({
					// 	    title: 'Confirmer la suppression',
					// 	    content: 'Cette filière sera supprimée',
					// 	    buttons: {
					// 	        confirm: {
					// 	        	text: "OK",
					// 	        	btnClass: 'btn-info',
					// 	        	action : function () {
					// 	        	    delete_filiere(i,current_row);
					// 	        	}
					// 	        },
					// 	        cancel: {
					// 	        	text: "Annuler",
					// 	        	action : function () {
					// 	        	    //$.alert('Confirmed!');
					// 	        	}
					// 	        }
					// 	    }
					// 	});
					// });
 

                    $('[data-menu]').menu();


                    //alert( 'DataTables has finished its initialisation.' );
                  },
            processing:true,  
              serverSide:true,
              ajax:{  
                      url: base_url+"/services/parcourir_documents/2",  
                      type:"POST",
                      dataSrc:function(j){
                      	console.log(j)
                        $('.nbtable').html(j.recordsFiltered);
                       return j.data;
                      },
                      mRender: function (data, type, ab) {
                        if (ab == null) {
                             return ''; 
                        }
                      },

            },
            createdRow: function(row, data, index) {
                $('td', row).eq(0).addClass('js-select text-left g-first-child'); // 6 is index of column
			},
            aaSorting: [[ 0, "desc" ]],
            lengthMenu: [[10, 20, -1], [10, 20, "Tout"]],
            pageLength: 8,
            iDisplayLength:25,
            language: {
             "searchPlaceholder": "Recherche",
             "sProcessing":     "Recherche en cours...",
              "sSearch":         "",
              "sLengthMenu":     "Afficher _MENU_ &eacute;l&eacute;ments &nbsp;&nbsp;&nbsp;",
              "sInfo":           "_TOTAL_ élément(s) au total  ",
              "sInfoEmpty":      "Affichage de l'&eacute;l&eacute;ment 0 &agrave; 0 sur 0 &eacute;l&eacute;ment",
              "sInfoFiltered":   "(filtr&eacute; de _MAX_ &eacute;l&eacute;ments au total)",
              "sInfoPostFix":    "",
              "sLoadingRecords": "Chargement en cours...",
              "sZeroRecords":    "Aucun &eacute;l&eacute;ment &agrave; afficher",
              "sEmptyTable":     "Aucune donn&eacute;e disponible dans le tableau",
              "oPaginate": {            
                "sFirst":      "Premier",
                "sPrevious":   "<i class='hs-admin-angle-left'><i>",
                "sNext":       "<i class='hs-admin-angle-right'><i>",
                "sLast":       "Dernier"
              },
              "oAria": {
                "sSortAscending":  ": activer pour trier la colonne par ordre croissant",
                "sSortDescending": ": activer pour trier la colonne par ordre d&eacute;croissant"
              }
            },
            // columnDefs: [{ visible: false, targets: 3 }],
            /*sDom:"<'form-control g-font-size-default g-brd-gray-dark-v7 g-brd-darkblue-v3--focus g-rounded-20 g-pl-20 g-pr-50 g-py-10'>lr",*/
            dom: "<'row'<'col-sm-4'l><'col-sm-4 text-center'B><'col-sm-4'f>>tp",
            "lengthMenu": [ [10, 25, 50, -1], [10, 25, 50, "Tout"] ],
            buttons: [
            	{extend: 'colvis',className: 'btn-sm',text:'<i class="fa fa-eye"></i> Visibilité',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'copy',className: 'btn-sm',text:'<i class="fa fa-copy"></i> Copier',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'csv',title: 'IFSIO WEB CONSOLE - Liste des documents', className: 'btn-sm',text:'<i class="fa fa-file-excel-o"></i> CSV',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'pdf', title: 'IFSIO WEB CONSOLE - Liste des documents', className: 'btn-sm',text:'<i class="fa fa-file-pdf-o"></i> PDF',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'print', title: 'IFSIO WEB CONSOLE - Liste des documents',className: 'btn-sm',text:'<i class="fa fa-print"></i> Imprimer',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	}
            ]
});



$('#administrer_documents_table').dataTable( {
            fnDrawCallback: function(settings, json) {
                    $.HSCore.components.HSDropdown.init($('[data-dropdown-target]'), {
                      dropdownHideOnScroll: false,
                      dropdownType: 'css-animation',
                      dropdownAnimationIn: 'fadeIn',
                      dropdownAnimationOut: 'fadeOut'
                    });

                    $('.cloturer_document').on('click', function (e){
                    	e.preventDefault()
						var i = $(this).attr('i');
						var current_row = $(this).closest('tr'); 
						var ty = $(this).attr('ty'); 
						var ee = $(this).attr('e'); 
						var a = $(this).attr('a'); 

						var fm = $(this).attr('fm'); 
						var fp = $(this).attr('fp'); 
						var fq = $(this).attr('fq'); 
						var ce = $(this).attr('ce'); 
						var fi_num_flag = $(this).attr('fi_num_flag'); 
						var fi_num = $(this).attr('fi_num'); 
						$(".lbl_type").text(ty)
						$(".lbl_etudiant").text(ee)
						$(".lbl_annee").text(a)
						// alert(fm)
						$("#form_cloture_document input[name=p_i]").val(i);
						$("#form_cloture_document").find("#demande_manuscrite").attr("href", fm);
						$("#form_cloture_document").find("#fiche_pre_inscription").attr("href", fp);
						$("#form_cloture_document").find("#quittance_paiement_droits").attr("href", fq);
						$("#form_cloture_document").find("#carte_etudiant").attr("href", ce);

						if (fi_num_flag) {
							$('#lien_fichier_numerique').removeClass('hide')
							$("#form_cloture_document").find("#lien_fichier_numerique").attr("href", fi_num);
							// $("#form_cloture_document").find("button").text("Enregistrer");
						}else{
							$('#lien_fichier_numerique').addClass('hide')
							$("#form_cloture_document").find("#lien_fichier_numerique").attr("href", "#");
							// $("#form_cloture_document").find("button").text("Clôturer");
							
						}
						

						// $("textarea[name=parcours_observations]").val(o);

						$("#modal_documents_cloturer_btn").trigger('click')
					});
 

                    $('[data-menu]').menu();


                    //alert( 'DataTables has finished its initialisation.' );
                  },
            processing:true,  
              serverSide:true,
              ajax:{  
                      url: base_url+"/services/parcourir_administrer_documents/1",  
                      type:"POST"  ,
                      dataSrc:function(j){
                      	console.log(j)
                        $('.nbtable').html(j.recordsFiltered);
                       return j.data;
                      },
                      mRender: function (data, type, ab) {
                        if (ab == null) {
                             return ''; 
                        }
                      },

            },
            createdRow: function(row, data, index) {
                $('td', row).eq(0).addClass('js-select text-left g-first-child'); // 6 is index of column
			},
            aaSorting: [[ 0, "desc" ]],
            lengthMenu: [[10, 20, -1], [10, 20, "Tout"]],
            pageLength: 8,
            iDisplayLength:25,
            language: {
             "searchPlaceholder": "Recherche",
             "sProcessing":     "Recherche en cours...",
              "sSearch":         "",
              "sLengthMenu":     "Afficher _MENU_ &eacute;l&eacute;ments &nbsp;&nbsp;&nbsp;",
              "sInfo":           "_TOTAL_ élément(s) au total  ",
              "sInfoEmpty":      "Affichage de l'&eacute;l&eacute;ment 0 &agrave; 0 sur 0 &eacute;l&eacute;ment",
              "sInfoFiltered":   "(filtr&eacute; de _MAX_ &eacute;l&eacute;ments au total)",
              "sInfoPostFix":    "",
              "sLoadingRecords": "Chargement en cours...",
              "sZeroRecords":    "Aucun &eacute;l&eacute;ment &agrave; afficher",
              "sEmptyTable":     "Aucune donn&eacute;e disponible dans le tableau",
              "oPaginate": {            
                "sFirst":      "Premier",
                "sPrevious":   "<i class='hs-admin-angle-left'><i>",
                "sNext":       "<i class='hs-admin-angle-right'><i>",
                "sLast":       "Dernier"
              },
              "oAria": {
                "sSortAscending":  ": activer pour trier la colonne par ordre croissant",
                "sSortDescending": ": activer pour trier la colonne par ordre d&eacute;croissant"
              }
            },
            // columnDefs: [{ visible: false, targets: 3 }],
            /*sDom:"<'form-control g-font-size-default g-brd-gray-dark-v7 g-brd-darkblue-v3--focus g-rounded-20 g-pl-20 g-pr-50 g-py-10'>lr",*/
            dom: "<'row'<'col-sm-4'l><'col-sm-4 text-center'B><'col-sm-4'f>>tp",
            "lengthMenu": [ [10, 25, 50, -1], [10, 25, 50, "Tout"] ],
            buttons: [
            	{extend: 'colvis',className: 'btn-sm',text:'<i class="fa fa-eye"></i> Visibilité',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'copy',className: 'btn-sm',text:'<i class="fa fa-copy"></i> Copier',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'csv',title: 'IFSIO WEB CONSOLE - Liste des documents', className: 'btn-sm',text:'<i class="fa fa-file-excel-o"></i> CSV',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'pdf', title: 'IFSIO WEB CONSOLE - Liste des documents', className: 'btn-sm',text:'<i class="fa fa-file-pdf-o"></i> PDF',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'print', title: 'IFSIO WEB CONSOLE - Liste des documents',className: 'btn-sm',text:'<i class="fa fa-print"></i> Imprimer',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	}
            ]
});

$('#administrer_documents_clotures_table').dataTable( {
            fnDrawCallback: function(settings, json) {
                    $.HSCore.components.HSDropdown.init($('[data-dropdown-target]'), {
                      dropdownHideOnScroll: false,
                      dropdownType: 'css-animation',
                      dropdownAnimationIn: 'fadeIn',
                      dropdownAnimationOut: 'fadeOut'
                    });

                    $('.cloturer_document').on('click', function (e){
                    	e.preventDefault()
						var i = $(this).attr('i');
						var current_row = $(this).closest('tr'); 
						var ty = $(this).attr('ty'); 
						var ee = $(this).attr('e'); 
						var a = $(this).attr('a'); 

						var fm = $(this).attr('fm'); 
						var fp = $(this).attr('fp'); 
						var fq = $(this).attr('fq'); 
						var ce = $(this).attr('ce'); 
						var fi_num_flag = $(this).attr('fi_num_flag'); 
						var fi_num = $(this).attr('fi_num'); 
						$(".lbl_type").text(ty)
						$(".lbl_etudiant").text(ee)
						$(".lbl_annee").text(a)
						// alert(fm)
						$("#form_cloture_document input[name=p_i]").val(i);
						$("#form_cloture_document").find("#demande_manuscrite").attr("href", fm);
						$("#form_cloture_document").find("#fiche_pre_inscription").attr("href", fp);
						$("#form_cloture_document").find("#quittance_paiement_droits").attr("href", fq);
						$("#form_cloture_document").find("#carte_etudiant").attr("href", ce);

						if (fi_num_flag) {
							$('#lien_fichier_numerique').removeClass('hide')
							$("#form_cloture_document").find("#lien_fichier_numerique").attr("href", fi_num);
							// $("#form_cloture_document").find("button").text("Enregistrer");
						}else{
							$('#lien_fichier_numerique').addClass('hide')
							$("#form_cloture_document").find("#lien_fichier_numerique").attr("href", "#");
							// $("#form_cloture_document").find("button").text("Clôturer");
							
						}
						

						// $("textarea[name=parcours_observations]").val(o);

						$("#modal_documents_cloturer_btn").trigger('click')
					});
 

                    $('[data-menu]').menu();


                    //alert( 'DataTables has finished its initialisation.' );
                  },
            processing:true,  
              serverSide:true,
              ajax:{  
                      url: base_url+"/services/parcourir_administrer_documents/2",  
                      type:"POST"  ,
                      dataSrc:function(j){
                      	console.log(j)
                        $('.nbtable').html(j.recordsFiltered);
                       return j.data;
                      },
                      mRender: function (data, type, ab) {
                        if (ab == null) {
                             return ''; 
                        }
                      },

            },
            createdRow: function(row, data, index) {
                $('td', row).eq(0).addClass('js-select text-left g-first-child'); // 6 is index of column
			},
            aaSorting: [[ 0, "desc" ]],
            lengthMenu: [[10, 20, -1], [10, 20, "Tout"]],
            pageLength: 8,
            iDisplayLength:25,
            language: {
             "searchPlaceholder": "Recherche",
             "sProcessing":     "Recherche en cours...",
              "sSearch":         "",
              "sLengthMenu":     "Afficher _MENU_ &eacute;l&eacute;ments &nbsp;&nbsp;&nbsp;",
              "sInfo":           "_TOTAL_ élément(s) au total  ",
              "sInfoEmpty":      "Affichage de l'&eacute;l&eacute;ment 0 &agrave; 0 sur 0 &eacute;l&eacute;ment",
              "sInfoFiltered":   "(filtr&eacute; de _MAX_ &eacute;l&eacute;ments au total)",
              "sInfoPostFix":    "",
              "sLoadingRecords": "Chargement en cours...",
              "sZeroRecords":    "Aucun &eacute;l&eacute;ment &agrave; afficher",
              "sEmptyTable":     "Aucune donn&eacute;e disponible dans le tableau",
              "oPaginate": {            
                "sFirst":      "Premier",
                "sPrevious":   "<i class='hs-admin-angle-left'><i>",
                "sNext":       "<i class='hs-admin-angle-right'><i>",
                "sLast":       "Dernier"
              },
              "oAria": {
                "sSortAscending":  ": activer pour trier la colonne par ordre croissant",
                "sSortDescending": ": activer pour trier la colonne par ordre d&eacute;croissant"
              }
            },
            // columnDefs: [{ visible: false, targets: 3 }],
            /*sDom:"<'form-control g-font-size-default g-brd-gray-dark-v7 g-brd-darkblue-v3--focus g-rounded-20 g-pl-20 g-pr-50 g-py-10'>lr",*/
            dom: "<'row'<'col-sm-4'l><'col-sm-4 text-center'B><'col-sm-4'f>>tp",
            "lengthMenu": [ [10, 25, 50, -1], [10, 25, 50, "Tout"] ],
            buttons: [
            	{extend: 'colvis',className: 'btn-sm',text:'<i class="fa fa-eye"></i> Visibilité',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'copy',className: 'btn-sm',text:'<i class="fa fa-copy"></i> Copier',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'csv',title: 'IFSIO WEB CONSOLE - Liste des documents', className: 'btn-sm',text:'<i class="fa fa-file-excel-o"></i> CSV',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'pdf', title: 'IFSIO WEB CONSOLE - Liste des documents', className: 'btn-sm',text:'<i class="fa fa-file-pdf-o"></i> PDF',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'print', title: 'IFSIO WEB CONSOLE - Liste des documents',className: 'btn-sm',text:'<i class="fa fa-print"></i> Imprimer',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	}
            ]
});


$('#paiements_documents_table').dataTable( {
            fnDrawCallback: function(settings, json) {
                    $.HSCore.components.HSDropdown.init($('[data-dropdown-target]'), {
                      dropdownHideOnScroll: false,
                      dropdownType: 'css-animation',
                      dropdownAnimationIn: 'fadeIn',
                      dropdownAnimationOut: 'fadeOut'
                    });

                    $('.paiement_update_statut').on('click', function (){
						var h = $(this).attr('h');
						var current_row = $(this).closest('tr');
						$.confirm({
						    title: 'Confirmer le statut',
						    content: 'Le statut de cette demande passera à "Payé" ',
						    buttons: {
						        confirm: {
						        	text: "OK",
						        	btnClass: 'btn-info',
						        	action : function () {
						        	    location.href = h
						        	}
						        },
						        cancel: {
						        	text: "Annuler",
						        	action : function () {
						        	    //$.alert('Confirmed!');
						        	}
						        }
						    }
						});
					});


 

                    $('[data-menu]').menu();


                    //alert( 'DataTables has finished its initialisation.' );
                  },
            processing:true,  
              serverSide:true,
              ajax:{  
                      url: base_url+"/services/parcourir_paiements_documents",  
                      type:"POST"  ,
                      dataSrc:function(j){
                      	console.log(j)
                        $('.nbtable').html(j.recordsFiltered);
                       return j.data;
                      },
                      mRender: function (data, type, ab) {
                        if (ab == null) {
                             return ''; 
                        }
                      },

            },
            createdRow: function(row, data, index) {
                $('td', row).eq(0).addClass('js-select text-left g-first-child'); // 6 is index of column
			},
            aaSorting: [[ 0, "desc" ]],
            lengthMenu: [[10, 20, -1], [10, 20, "Tout"]],
            pageLength: 8,
            iDisplayLength:25,
            language: {
             "searchPlaceholder": "Recherche",
             "sProcessing":     "Recherche en cours...",
              "sSearch":         "",
              "sLengthMenu":     "Afficher _MENU_ &eacute;l&eacute;ments &nbsp;&nbsp;&nbsp;",
              "sInfo":           "_TOTAL_ élément(s) au total  ",
              "sInfoEmpty":      "Affichage de l'&eacute;l&eacute;ment 0 &agrave; 0 sur 0 &eacute;l&eacute;ment",
              "sInfoFiltered":   "(filtr&eacute; de _MAX_ &eacute;l&eacute;ments au total)",
              "sInfoPostFix":    "",
              "sLoadingRecords": "Chargement en cours...",
              "sZeroRecords":    "Aucun &eacute;l&eacute;ment &agrave; afficher",
              "sEmptyTable":     "Aucune donn&eacute;e disponible dans le tableau",
              "oPaginate": {            
                "sFirst":      "Premier",
                "sPrevious":   "<i class='hs-admin-angle-left'><i>",
                "sNext":       "<i class='hs-admin-angle-right'><i>",
                "sLast":       "Dernier"
              },
              "oAria": {
                "sSortAscending":  ": activer pour trier la colonne par ordre croissant",
                "sSortDescending": ": activer pour trier la colonne par ordre d&eacute;croissant"
              }
            },
            // columnDefs: [{ visible: false, targets: 3 }],
            /*sDom:"<'form-control g-font-size-default g-brd-gray-dark-v7 g-brd-darkblue-v3--focus g-rounded-20 g-pl-20 g-pr-50 g-py-10'>lr",*/
            dom: "<'row'<'col-sm-4'l><'col-sm-4 text-center'B><'col-sm-4'f>>tp",
            "lengthMenu": [ [10, 25, 50, -1], [10, 25, 50, "Tout"] ],
            buttons: [
            	{extend: 'colvis',className: 'btn-sm',text:'<i class="fa fa-eye"></i> Visibilité',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'copy',className: 'btn-sm',text:'<i class="fa fa-copy"></i> Copier',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'csv',title: 'IFSIO WEB CONSOLE - Liste des documents', className: 'btn-sm',text:'<i class="fa fa-file-excel-o"></i> CSV',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'pdf', title: 'IFSIO WEB CONSOLE - Liste des documents', className: 'btn-sm',text:'<i class="fa fa-file-pdf-o"></i> PDF',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'print', title: 'IFSIO WEB CONSOLE - Liste des documents',className: 'btn-sm',text:'<i class="fa fa-print"></i> Imprimer',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	}
            ]
});



$('#classes_table').dataTable( {
            fnDrawCallback: function(settings, json) {
                    $.HSCore.components.HSDropdown.init($('[data-dropdown-target]'), {
                      dropdownHideOnScroll: false,
                      dropdownType: 'css-animation',
                      dropdownAnimationIn: 'fadeIn',
                      dropdownAnimationOut: 'fadeOut'
                    });

                    // $('.parcours_del').on('click', function (){
					// 	var i = $(this).attr('i');
					// 	var current_row = $(this).closest('tr');
					// 	$.confirm({
					// 	    title: 'Confirmer la suppression',
					// 	    content: 'Cette filière sera supprimée',
					// 	    buttons: {
					// 	        confirm: {
					// 	        	text: "OK",
					// 	        	btnClass: 'btn-info',
					// 	        	action : function () {
					// 	        	    delete_filiere(i,current_row);
					// 	        	}
					// 	        },
					// 	        cancel: {
					// 	        	text: "Annuler",
					// 	        	action : function () {
					// 	        	    //$.alert('Confirmed!');
					// 	        	}
					// 	        }
					// 	    }
					// 	});
					// });
 

                    $('[data-menu]').menu();


                    //alert( 'DataTables has finished its initialisation.' );
                  },
            processing:true,  
              serverSide:true,
              ajax:{  
                      url: base_url+"/services/parcourir_classes",  
                      type:"POST"  ,
                      dataSrc:function(j){
                      	console.log(j)
                        $('.nbtable').html(j.recordsFiltered);
                       return j.data;
                      },
                      mRender: function (data, type, ab) {
                        if (ab == null) {
                             return ''; 
                        }
                      },

            },
            createdRow: function(row, data, index) {
                $('td', row).eq(0).addClass('js-select text-left g-first-child'); // 6 is index of column
			},
            aaSorting: [[ 0, "desc" ]],
            lengthMenu: [[10, 20, -1], [10, 20, "Tout"]],
            pageLength: 8,
            iDisplayLength:25,
            language: {
             "searchPlaceholder": "Recherche",
             "sProcessing":     "Recherche en cours...",
              "sSearch":         "",
              "sLengthMenu":     "Afficher _MENU_ &eacute;l&eacute;ments &nbsp;&nbsp;&nbsp;",
              "sInfo":           "_TOTAL_ élément(s) au total  ",
              "sInfoEmpty":      "Affichage de l'&eacute;l&eacute;ment 0 &agrave; 0 sur 0 &eacute;l&eacute;ment",
              "sInfoFiltered":   "(filtr&eacute; de _MAX_ &eacute;l&eacute;ments au total)",
              "sInfoPostFix":    "",
              "sLoadingRecords": "Chargement en cours...",
              "sZeroRecords":    "Aucun &eacute;l&eacute;ment &agrave; afficher",
              "sEmptyTable":     "Aucune donn&eacute;e disponible dans le tableau",
              "oPaginate": {            
                "sFirst":      "Premier",
                "sPrevious":   "<i class='hs-admin-angle-left'><i>",
                "sNext":       "<i class='hs-admin-angle-right'><i>",
                "sLast":       "Dernier"
              },
              "oAria": {
                "sSortAscending":  ": activer pour trier la colonne par ordre croissant",
                "sSortDescending": ": activer pour trier la colonne par ordre d&eacute;croissant"
              }
            },
            // columnDefs: [{ visible: false, targets: 1 }],
            /*sDom:"<'form-control g-font-size-default g-brd-gray-dark-v7 g-brd-darkblue-v3--focus g-rounded-20 g-pl-20 g-pr-50 g-py-10'>lr",*/
            dom: "<'row'<'col-sm-4'l><'col-sm-4 text-center'B><'col-sm-4'f>>tp",
            "lengthMenu": [ [10, 25, 50, -1], [10, 25, 50, "Tout"] ],
            buttons: [
            	{extend: 'colvis',className: 'btn-sm',text:'<i class="fa fa-eye"></i> Visibilité',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'copy',className: 'btn-sm',text:'<i class="fa fa-copy"></i> Copier',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'csv',title: 'IFSIO WEB CONSOLE - Liste des classes de cours', className: 'btn-sm',text:'<i class="fa fa-file-excel-o"></i> CSV',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'pdf', title: 'IFSIO WEB CONSOLE - Liste des classes de cours', className: 'btn-sm',text:'<i class="fa fa-file-pdf-o"></i> PDF',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'print', title: 'IFSIO WEB CONSOLE - Liste des classes de cours',className: 'btn-sm',text:'<i class="fa fa-print"></i> Imprimer',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	}
            ]
});

$('#professeur_ressources_table').dataTable( {
    fnDrawCallback: function(settings, json) {
            $.HSCore.components.HSDropdown.init($('[data-dropdown-target]'), {
              dropdownHideOnScroll: false,
              dropdownType: 'css-animation',
              dropdownAnimationIn: 'fadeIn',
              dropdownAnimationOut: 'fadeOut'
            });

            $('.ressource_del').on('click', function (){
				var i = $(this).attr('i');
				var current_row = $(this).closest('tr');
				$.confirm({
				    title: 'Confirmer la suppression',
				    content: 'Cette ressource sera supprimée',
				    buttons: {
				        confirm: {
				        	text: "OK",
				        	btnClass: 'btn-info',
				        	action : function () {
				        	    delete_ressource(i,current_row);
				        	}
				        },
				        cancel: {
				        	text: "Annuler",
				        	action : function () {
				        	    //$.alert('Confirmed!');
				        	}
				        }
				    }
				});
			});


            $('[data-menu]').menu();


            //alert( 'DataTables has finished its initialisation.' );
          },
    processing:true,  
      serverSide:true,
      ajax:{  
              url: base_url+"/services/parcourir_professeur_ressources",  
              type:"POST"  ,
              dataSrc:function(j){
              	console.log(j)
                $('.nbtable').html(j.recordsFiltered);
               return j.data;
              },
              mRender: function (data, type, ab) {
                if (ab == null) {
                     return ''; 
                }
              },

    },
    createdRow: function(row, data, index) {
        $('td', row).eq(0).addClass('js-select text-left g-first-child'); // 6 is index of column
	},
    aaSorting: [[ 0, "desc" ]],
    lengthMenu: [[10, 20, -1], [10, 20, "Tout"]],
    pageLength: 8,
    iDisplayLength:25,
    language: {
     "searchPlaceholder": "Recherche",
     "sProcessing":     "Recherche en cours...",
      "sSearch":         "",
      "sLengthMenu":     "Afficher _MENU_ &eacute;l&eacute;ments &nbsp;&nbsp;&nbsp;",
      "sInfo":           "_TOTAL_ élément(s) au total  ",
      "sInfoEmpty":      "Affichage de l'&eacute;l&eacute;ment 0 &agrave; 0 sur 0 &eacute;l&eacute;ment",
      "sInfoFiltered":   "(filtr&eacute; de _MAX_ &eacute;l&eacute;ments au total)",
      "sInfoPostFix":    "",
      "sLoadingRecords": "Chargement en cours...",
      "sZeroRecords":    "Aucun &eacute;l&eacute;ment &agrave; afficher",
      "sEmptyTable":     "Aucune donn&eacute;e disponible dans le tableau",
      "oPaginate": {            
        "sFirst":      "Premier",
        "sPrevious":   "<i class='hs-admin-angle-left'><i>",
        "sNext":       "<i class='hs-admin-angle-right'><i>",
        "sLast":       "Dernier"
      },
      "oAria": {
        "sSortAscending":  ": activer pour trier la colonne par ordre croissant",
        "sSortDescending": ": activer pour trier la colonne par ordre d&eacute;croissant"
      }
    },
    // columnDefs: [{ visible: false, targets: 1 }],
    /*sDom:"<'form-control g-font-size-default g-brd-gray-dark-v7 g-brd-darkblue-v3--focus g-rounded-20 g-pl-20 g-pr-50 g-py-10'>lr",*/
    dom: "<'row'<'col-sm-4'l><'col-sm-4 text-center'B><'col-sm-4'f>>tp",
    "lengthMenu": [ [10, 25, 50, -1], [10, 25, 50, "Tout"] ],
    buttons: [
    	{extend: 'colvis',className: 'btn-sm',text:'<i class="fa fa-eye"></i> Visibilité',
        	exportOptions:{
        		columns: ':not(.notexport)'
        	}

    	},
        {extend: 'copy',className: 'btn-sm',text:'<i class="fa fa-copy"></i> Copier',
        	exportOptions:{
        		columns: ':not(.notexport)'
        	}

    	},
        {extend: 'csv',title: 'IFSIO WEB CONSOLE - Liste des ressources', className: 'btn-sm',text:'<i class="fa fa-file-excel-o"></i> CSV',
        	exportOptions:{
        		columns: ':not(.notexport)'
        	}

    	},
        {extend: 'pdf', title: 'IFSIO WEB CONSOLE - Liste des ressources', className: 'btn-sm',text:'<i class="fa fa-file-pdf-o"></i> PDF',
        	exportOptions:{
        		columns: ':not(.notexport)'
        	}

    	},
        {extend: 'print', title: 'IFSIO WEB CONSOLE - Liste des ressources',className: 'btn-sm',text:'<i class="fa fa-print"></i> Imprimer',
        	exportOptions:{
        		columns: ':not(.notexport)'
        	}

    	}
    ]
});


var id_i = $("#donnees_valides_table").attr('i');				
$('#donnees_valides_table').dataTable( {
    fnDrawCallback: function(settings, json) {
            $.HSCore.components.HSDropdown.init($('[data-dropdown-target]'), {
              dropdownHideOnScroll: false,
              dropdownType: 'css-animation',
              dropdownAnimationIn: 'fadeIn',
              dropdownAnimationOut: 'fadeOut'
            });

            $('.donnee_valide_del').on('click', function (){
				var i = $(this).attr('i');
				var current_row = $(this).closest('tr');
				$.confirm({
				    title: 'Confirmer la suppression',
				    content: 'Cette donnée sera supprimée',
				    buttons: {
				        confirm: {
				        	text: "OK",
				        	btnClass: 'btn-info',
				        	action : function () {
				        	    delete_donnee_valide(i,current_row);
				        	}
				        },
				        cancel: {
				        	text: "Annuler",
				        	action : function () {
				        	    //$.alert('Confirmed!');
				        	}
				        }
				    }
				});
			});

			$('.donnee_valide_update').on('click', function (){
				var i = $(this).attr('i');
				var n = $(this).attr('n');
				var nom = $(this).attr('nom');
				var prenoms = $(this).attr('prenoms');
				var matricule = $(this).attr('matricule');
				var diplome = $(this).attr('diplome');
				var filiere = $(this).attr('filiere');
				$("input[name=d_i]").val(i); 
				var current_row = $(this).closest('tr'); 
				var a_i = $("input[name=a_i]").val(); 

				$("#form_donnee_valide").find('h4.update').removeClass('hide') 
				$("#form_donnee_valide").find('span.lbl_matricule').text(n)

				$("#form_donnee_valide").find('input[name=donnees_nom]').val(nom)
				$("#form_donnee_valide").find('input[name=donnees_prenoms]').val(prenoms)
				$("#form_donnee_valide").find('input[name=donnees_matricule]').val(matricule)
				$("#form_donnee_valide").find('select[name=donnees_diplome]').val(diplome)
				$("#form_donnee_valide").find('input[name=donnees_filiere]').val(filiere)
				// alert(filiere)
				$("#form_donnee_valide").find('h4.new').addClass('hide')
				$("#modal_donnee_valide_btn").trigger('click')
			});

			$('#btn_add_donnee').on('click', function (e){
				e.preventDefault()
      			// alert('oo');return 
				$("input[name=d_i]").val(""); 
				var current_row = $(this).closest('tr'); 
				var a_i = $("input[name=a_i]").val(); 
				// alert(a_i)
				$("#form_donnee_valide").find('h4.new').removeClass('hide')
				// if (!$("#form_donnee_valide").find('h4.new').hasClass('hide')) {
					// $("#form_donnee_valide").find('h4.new').removeClass('hide')
				// }
				
				$("#form_donnee_valide").find('span.lbl_matricule').text("")

				$("#form_donnee_valide").find('input[name=donnees_nom]').val("")
				$("#form_donnee_valide").find('input[name=donnees_prenoms]').val("")
				$("#form_donnee_valide").find('input[name=donnees_matricule]').val("")
				$("#form_donnee_valide").find('select[name=donnees_diplome]').val("")
				$("#form_donnee_valide").find('input[name=donnees_filiere]').val("")
 
				// alert(filiere) 
				$("#form_donnee_valide").find('h4.update').addClass('hide')
				$("#modal_donnee_valide_btn").trigger('click')
			});
 


            

            $('[data-menu]').menu();


            //alert( 'DataTables has finished its initialisation.' );
          },
    processing:true,  
      serverSide:true,
      ajax:{  
              url: base_url+"/services/parcourir_donnees_valides/"+id_i,  
              type:"POST"  ,
              dataSrc:function(j){
              	console.log(j)
                $('.nbtable').html(j.recordsFiltered);
               return j.data;
              },
              mRender: function (data, type, ab) {
                if (ab == null) {
                     return ''; 
                }
              },

    },
    createdRow: function(row, data, index) {
        $('td', row).eq(0).addClass('js-select text-left g-first-child'); // 6 is index of column
	},
    aaSorting: [[ 0, "desc" ]],
    lengthMenu: [[10, 20, -1], [10, 20, "Tout"]],
    pageLength: 8,
    iDisplayLength:25,
    language: {
     "searchPlaceholder": "Recherche",
     "sProcessing":     "Recherche en cours...",
      "sSearch":         "",
      "sLengthMenu":     "Afficher _MENU_ &eacute;l&eacute;ments &nbsp;&nbsp;&nbsp;",
      "sInfo":           "_TOTAL_ élément(s) au total  ",
      "sInfoEmpty":      "Affichage de l'&eacute;l&eacute;ment 0 &agrave; 0 sur 0 &eacute;l&eacute;ment",
      "sInfoFiltered":   "(filtr&eacute; de _MAX_ &eacute;l&eacute;ments au total)",
      "sInfoPostFix":    "",
      "sLoadingRecords": "Chargement en cours...",
      "sZeroRecords":    "Aucun &eacute;l&eacute;ment &agrave; afficher",
      "sEmptyTable":     "Aucune donn&eacute;e disponible dans le tableau",
      "oPaginate": {            
        "sFirst":      "Premier",
        "sPrevious":   "<i class='hs-admin-angle-left'><i>",
        "sNext":       "<i class='hs-admin-angle-right'><i>",
        "sLast":       "Dernier"
      },
      "oAria": {
        "sSortAscending":  ": activer pour trier la colonne par ordre croissant",
        "sSortDescending": ": activer pour trier la colonne par ordre d&eacute;croissant"
      }
    },
    columnDefs: [{ visible: false, targets: 0 }],
    /*sDom:"<'form-control g-font-size-default g-brd-gray-dark-v7 g-brd-darkblue-v3--focus g-rounded-20 g-pl-20 g-pr-50 g-py-10'>lr",*/
    dom: "<'row'<'col-sm-4'l><'col-sm-4 text-center'B><'col-sm-4'f>>tp",
    "lengthMenu": [ [10, 25, 50, -1], [10, 25, 50, "Tout"] ],
    buttons: [
    	// {
        //             text: 'My button',
        //             action: function (e, dt, node, config) {
        //                 alert('Button activated');
        //             }
        //         },
    	{extend: 'colvis',className: 'btn-sm',text:'<i class="fa fa-eye"></i> Visibilité',
        	exportOptions:{
        		columns: ':not(.notexport)'
        	}

    	},
        {extend: 'copy',className: 'btn-sm',text:'<i class="fa fa-copy"></i> Copier',
        	exportOptions:{
        		columns: ':not(.notexport)'
        	}

    	},
        {extend: 'csv',title: 'IFSIO WEB CONSOLE - Liste des données importées', className: 'btn-sm',text:'<i class="fa fa-file-excel-o"></i> CSV',
        	exportOptions:{
        		columns: ':not(.notexport)'
        	}

    	},
        {extend: 'pdf', title: 'IFSIO WEB CONSOLE - Liste des données importées', className: 'btn-sm',text:'<i class="fa fa-file-pdf-o"></i> PDF',
        	exportOptions:{
        		columns: ':not(.notexport)'
        	}

    	},
        {extend: 'print', title: 'IFSIO WEB CONSOLE - Liste des données importées',className: 'btn-sm',text:'<i class="fa fa-print"></i> Imprimer',
        	exportOptions:{
        		columns: ':not(.notexport)'
        	}

    	}
    ]
});





$('#ressources_table').dataTable( {
            fnDrawCallback: function(settings, json) {
                    $.HSCore.components.HSDropdown.init($('[data-dropdown-target]'), {
                      dropdownHideOnScroll: false,
                      dropdownType: 'css-animation',
                      dropdownAnimationIn: 'fadeIn',
                      dropdownAnimationOut: 'fadeOut'
                    });
 
 

                    $('[data-menu]').menu();


                    //alert( 'DataTables has finished its initialisation.' );
                  },
            processing:true,  
              serverSide:true,
              ajax:{  
                      url: base_url+"/services/parcourir_ressources",  
                      type:"POST"  ,
                      dataSrc:function(j){
                      	console.log(j)
                        $('.nbtable').html(j.recordsFiltered);
                       return j.data;
                      },
                      mRender: function (data, type, ab) {
                        if (ab == null) {
                             return ''; 
                        }
                      },

            },
            createdRow: function(row, data, index) {
                $('td', row).eq(0).addClass('js-select text-left g-first-child'); // 6 is index of column
			},
            aaSorting: [[ 0, "desc" ]],
            lengthMenu: [[10, 20, -1], [10, 20, "Tout"]],
            pageLength: 8,
            iDisplayLength:25,
            language: {
             "searchPlaceholder": "Recherche",
             "sProcessing":     "Recherche en cours...",
              "sSearch":         "",
              "sLengthMenu":     "Afficher _MENU_ &eacute;l&eacute;ments &nbsp;&nbsp;&nbsp;",
              "sInfo":           "_TOTAL_ élément(s) au total  ",
              "sInfoEmpty":      "Affichage de l'&eacute;l&eacute;ment 0 &agrave; 0 sur 0 &eacute;l&eacute;ment",
              "sInfoFiltered":   "(filtr&eacute; de _MAX_ &eacute;l&eacute;ments au total)",
              "sInfoPostFix":    "",
              "sLoadingRecords": "Chargement en cours...",
              "sZeroRecords":    "Aucun &eacute;l&eacute;ment &agrave; afficher",
              "sEmptyTable":     "Aucune donn&eacute;e disponible dans le tableau",
              "oPaginate": {            
                "sFirst":      "Premier",
                "sPrevious":   "<i class='hs-admin-angle-left'><i>",
                "sNext":       "<i class='hs-admin-angle-right'><i>",
                "sLast":       "Dernier"
              },
              "oAria": {
                "sSortAscending":  ": activer pour trier la colonne par ordre croissant",
                "sSortDescending": ": activer pour trier la colonne par ordre d&eacute;croissant"
              }
            },
            // columnDefs: [{ visible: false, targets: 1 }],
            /*sDom:"<'form-control g-font-size-default g-brd-gray-dark-v7 g-brd-darkblue-v3--focus g-rounded-20 g-pl-20 g-pr-50 g-py-10'>lr",*/
            dom: "<'row'<'col-sm-4'l><'col-sm-4 text-center'B><'col-sm-4'f>>tp",
            "lengthMenu": [ [10, 25, 50, -1], [10, 25, 50, "Tout"] ],
            buttons: [
            	{extend: 'colvis',className: 'btn-sm',text:'<i class="fa fa-eye"></i> Visibilité',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'copy',className: 'btn-sm',text:'<i class="fa fa-copy"></i> Copier',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'csv',title: 'IFSIO WEB CONSOLE - Liste des ressources', className: 'btn-sm',text:'<i class="fa fa-file-excel-o"></i> CSV',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'pdf', title: 'IFSIO WEB CONSOLE - Liste des ressources', className: 'btn-sm',text:'<i class="fa fa-file-pdf-o"></i> PDF',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	},
                {extend: 'print', title: 'IFSIO WEB CONSOLE - Liste des ressources',className: 'btn-sm',text:'<i class="fa fa-print"></i> Imprimer',
                	exportOptions:{
                		columns: ':not(.notexport)'
                	}

            	}
            ]
});


