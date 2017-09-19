// ./artemplateanalyseswidget.pt
// ../../../browser/widgets/artemplateanalyseswidget.py

// Most of this code is shared in ../../../browser/js/ar_analyses.pt
// There are a few differences, because this widget holds a dictionary,
// where the AR form reads and writes ARAnalysesField.
// Also note, the form_id is different, so checkboxes are called
// analyses_cb_* here, an list_cb_* there, ar_x_Analyses there, uids:list here.

(function( $ ) {
  "use strict";

  function expand_cat(service_uid){
    var cat = $("[name='Partition."+service_uid+":records']").parents("tr").attr("cat");
    var th = $("th[cat='"+cat+"']");
    if ($(th).hasClass("collapsed")){
      var table = $(th).parents(".bika-listing-table");
      // show sub TR rows
      $(table)
          .children("tbody")
          .children("tr[cat="+cat+"]")
          .toggle(true);
      $(th).removeClass("collapsed").addClass("expanded");
    }
  }

  function check_service(service_uid){
    // Add partition dropdown
    var element = $("[name='Partition."+service_uid+":records']");
    var select = "<select class='listing_select_entry' "+
        "name='Partition."+service_uid+":records' "+
        "field='Partition' uid='"+service_uid+"' "+
        "style='font-size: 100%'>";
    $.each(($("#Partitions_table td input").filter("[id^='Partitions-part_id']")), function(i,v) {
      var partid = $($(v)).val();
      select = select + "<option value='"+partid+"'>"+partid+
          "</option>";
    });
    select = select + "</select>";
    $(element).after(select);
    // remove hidden field
    $(element).remove();
    // expand_cat(service_uid);
  }

  function uncheck_service(service_uid){
    var element = $("[name='Partition."+service_uid+":records']");
    $(element).after(
      "<input type='hidden' name='Partition."+service_uid+":records'"+
          "value=''/>"
    );
    $(element).remove();
  }

  function add_Yes(dlg, element, dep_services){
    for(var i = 0; i<dep_services.length; i++){
      var service_uid = dep_services[i].Service_uid;
      if(! $("#analyses_cb_"+service_uid).prop("checked") ){
        check_service(service_uid);
        $("#analyses_cb_"+service_uid).prop("checked",true);
        expand_cat(service_uid);
      }
    }
    $(dlg).dialog("close");
    $("#messagebox").remove();
  }

  function add_No(dlg, element){
    if($(element).prop("checked") ){
      uncheck_service($(element).attr("value"));
      $(element).prop("checked",false);
    }
    $(dlg).dialog("close");
    $("#messagebox").remove();
  }

  function calcdependencies(elements, auto_yes) {
    /*jshint validthis:true */
    auto_yes = auto_yes || false;
    window.jarn.i18n.loadCatalog("bika");
    var _ = window.jarn.i18n.MessageFactory("bika");

    var dep;
    var i, cb;

    var lims = window.bika.lims;

    for(var elements_i = 0; elements_i < elements.length; elements_i++){
      var dep_services = [];  // actionable services
      var dep_titles = [];
      var element = elements[elements_i];
      var service_uid = $(element).attr("value");
      // selecting a service; discover dependencies
      if ($(element).prop("checked")){
        var Dependencies = lims.AnalysisService.Dependencies(service_uid);
        for(i = 0; i<Dependencies.length; i++) {
          dep = Dependencies[i];
          if ($("#analyses_cb_"+dep.Service_uid).prop("checked") ){
            continue; // skip if checked already
          }
          dep_services.push(dep);
          dep_titles.push(dep.Service);
        }
        if (dep_services.length > 0) {
          if (auto_yes) {
            add_Yes(this, element, dep_services);
          } else {
            var html = "<div id='messagebox' style='display:none' title='" + _("Service dependencies") + "'>";
            html = html + _("<p>${service} requires the following services to be selected:</p>"+
                            "<br/><p>${deps}</p><br/><p>Do you want to apply these selections now?</p>",
                            {
                              service: $(element).attr("title"),
                              deps: dep_titles.join("<br/>")
                            });
            html = html + "</div>";
            $("body").append(html);
            $("#messagebox").dialog({
              width:450,
              resizable:false,
              closeOnEscape: false,
              buttons:{
                yes: function(){
                  add_Yes(this, element, dep_services);
                },
                no: function(){
                  add_No(this, element);
                }
              }
            });
          }
        }
      }
      // unselecting a service; discover back dependencies
      else {
        var Dependants = lims.AnalysisService.Dependants(service_uid);
        for (i=0; i<Dependants.length; i++){
          dep = Dependants[i];
          cb = $("#analyses_cb_" + dep.Service_uid);
          if (cb.prop("checked")){
            dep_titles.push(dep.Service);
            dep_services.push(dep);
          }
        }
        if(dep_services.length > 0){
          if (auto_yes) {
            for(i=0; i<dep_services.length; i+=1) {
              dep = dep_services[i];
              service_uid = dep.Service_uid;
              cb = $("#analyses_cb_" + dep.Service_uid);
              uncheck_service(dep.Service_uid);
              $(cb).prop("checked", false);
            }
          } else {
            $("body").append(
              "<div id='messagebox' style='display:none' title='" + _("Service dependencies") + "'>"+
                  _("<p>The following services depend on ${service}, and will be unselected if you continue:</p><br/><p>${deps}</p><br/><p>Do you want to remove these selections now?</p>",
                    {service:$(element).attr("title"),
                     deps: dep_titles.join("<br/>")})+"</div>");
            $("#messagebox").dialog({
              width:450,
              resizable:false,
              closeOnEscape: false,
              buttons:{
                yes: function(){
                  for(i=0; i<dep_services.length; i+=1) {
                    dep = dep_services[i];
                    service_uid = dep.Service_uid;
                    cb = $("#analyses_cb_" + dep.Service_uid);
                    $(cb).prop("checked", false);
                    uncheck_service(dep.Service_uid);
                  }
                  $(this).dialog("close");
                  $("#messagebox").remove();
                },
                no:function(){
                  service_uid = $(element).attr("value");
                  check_service(service_uid);
                  $(element).prop("checked", true);
                  $("#messagebox").remove();
                  $(this).dialog("close");
                }
              }
            });
          }
        }
      }
    }
  }

  function setPartitionFields(part_nr, part_data) {
    var first_part_row = $(".records_row_Partitions")[part_nr];
    var container_uid = "";
    var container_title = "";
    if(part_data.container.length > 0){
      container_uid = part_data.container[0];
      container_title = part_data.container_titles[0];
    }
    $(first_part_row).find("input[id*='Partitions-Container']").attr("uid", container_uid);
    $(first_part_row).find("input[id*='Partitions-Container']").val(container_title);
    var preservation_uid = "";
    var preservation_title = "";
    if(part_data.preservation.length > 0){
      preservation_uid = part_data.preservation[0];
      preservation_title = part_data.preservation_titles[0];
    }
    $(first_part_row).find("input[id*='Partitions-Preservation']").attr("uid", preservation_uid);
    $(first_part_row).find("input[id*='Partitions-Preservation']").val(preservation_title);
  }


  function calc_parts_handler(data){
    var parts = data.parts;
    var i;
    // reset partition table
    for (i = $(".records_row_Partitions").length - 1; i >= 1; i--) {
      var e = $(".records_row_Partitions")[i];
      // remove part from Partition selector dropdowns
      var part = $($(e).find("input[id*='Partitions-part_id']")[0]).val();
      $("select[name^='Partition\\.']").find("option[value='"+part+"']").remove();
      // remove row from partition list
      $(e).remove();
    }
    // Edit existing first row
    if (parts.length > 0){
      setPartitionFields(0, parts[0]);
    }
    // Add rows and set container and preservation of part-2 and up
    for(i = 1; i < parts.length; i++){
      $("#Partitions_more").click();
      setPartitionFields(i, parts[i]);
    }
  }

  function calculate_parts() {
    var request_data;
    var st_minvol;
    var st_uid = $("#SampleType_uid").val();
    if(st_uid){
      var sampletype = {};
      $.ajaxSetup({async:false});
      window.bika.lims.jsonapi_read(request_data = {
        catalog_name: "uid_catalog",
        UID: st_uid,
        sort_on: 'Title'
      }, function(data){
        sampletype = data.objects[0];
      });
      $.ajaxSetup({async:true});
      st_minvol = sampletype.MinimumVolume.split(" ")[0];
      if(!st_minvol){
        st_minvol = 0;
      } else {
        st_minvol = parseFloat(st_minvol, 10);
      }
    } else {
      return;
      //st_uid = "";
      // st_minvol = 0;
    }
    var selected = $("[name$='uids\\:list']").filter(":checked");
    var service_uids = [];
    for(var i=0; i<selected.length; i++){
      service_uids.push($(selected[i]).attr("value"));
    }
    if(service_uids){
      request_data = {
        services: service_uids.join(","),
        sampletype: st_uid
      };
      window.jsonapi_cache = window.jsonapi_cache || {};
      var cacheKey = $.param(request_data);
      if (typeof window.jsonapi_cache[cacheKey] === "undefined") {
        $.ajax({
          type: "POST",
          dataType: "json",
          url: window.portal_url + "/@@API/calculate_partitions",
          data: request_data,
          success: function(data) {
            window.jsonapi_cache[cacheKey] = data;
            calc_parts_handler(data);
          }
        });
      } else {
        var data = window.jsonapi_cache[cacheKey];
        calc_parts_handler(data);
      }
    }
  }

  function setAnalysisProfile(){

    // clear existing selection
    $("input[id^='analyses_cb_']").filter(":checked").prop("checked", false);
    $.each($("select[name^='Partition']"), function(i, element){
      $(element).after(
        "<input type='hidden' name='"+$(element).attr("name")+"' value=''/>"
      );
      $(element).remove();
    });
    $("th.expanded").click();

    // Fetch the service data from the profile
    window.bika.lims.jsonapi_read({
      catalog_name: "uid_catalog",
      UID: $("#AnalysisProfile_uid").val(),
      sort_on: 'Title'
    }, function(profile_data){

      /* Expand Ajax Categories
         https://github.com/bikalabs/bika.lims/issues/2012
      */

      var service_data = profile_data.objects[0].service_data;
      var services = [];

      // create a set of categories to expand
      var categories_to_expand = [];
      $(service_data).each(function(index, service) {
        // remember the UIDs
        services.push(service.UID);
        var cat_title = service.CategoryTitle;
        if (categories_to_expand.indexOf(cat_title) < 0) {
          categories_to_expand.push(cat_title);
        }
      });

      // expand the categories
      var promises = [];

      $(categories_to_expand).each(function(index, cat_title) {
        var selector = "th[cat='" + cat_title + "']";
        var $th = $(selector);
        var d = category_header_expand_handler($th);
        promises.push(d);
      });

      console.info("Need to wait for " + promises.length + " categories to resolve...");

      // select analyses of the profile after all categories have been loaded
      $.when.apply($, promises).done(function() {
        console.debug("All " + promises.length + " Categories loaded!");
        $(services).each(function(index, uid) {
          var $cb = $("#analyses_cb_" + uid);
          $cb.prop("checked", true);
          console.debug("Select Analysis:", $cb.prop("alt"));
          check_service(uid);
          // calculate automatic partitions
          calculate_parts();
        });
      });
    });
  }

  function category_header_expand_handler(element) {
    // element is the category header TH.
    // duplicated in bika.lims.analysisrequest.add_by_col.js
    var def = $.Deferred();
    // with form_id allow multiple ajax-categorised tables in a page
    var form_id = $(element).parents("[form_id]").attr("form_id");
    var cat_title = $(element).attr('cat');
    // URL can be provided by bika_listing classes, with ajax_category_url attribute.
    var url = $("input[name='ajax_categories_url']").length > 0
        ? $("input[name='ajax_categories_url']").val()
        : window.location.href.split('?')[0];
    // We will replace this element with downloaded items:
    var placeholder = $("tr[data-ajax_category='" + cat_title + "']");

    // If it's already been expanded, ignore
    if ($(element).hasClass("expanded")) {
      def.resolve();
      return def.promise();
    }

    // If ajax_categories are enabled, we need to go request items now.
    var ajax_categories_enabled = $("input[name='ajax_categories']");
    if (ajax_categories_enabled.length > 0 && placeholder.length > 0) {
      var options = {};
      options['ajax_category_expand'] = 1;
      options['cat'] = cat_title;
      options['form_id'] = form_id;
      url = $("input[name='ajax_categories_url']").length > 0
          ? $("input[name='ajax_categories_url']").val()
          : url;
      if ($('.review_state_selector a.selected').length > 0) {
        // review_state must be kept the same after items are loaded
        // (TODO does this work?)
        options['review_state'] = $('.review_state_selector a.selected')[0].id;
      }
      $.ajax({url: url, data: options})
          .done(function (data) {
            // The same as: LIMS-1970 Analyses from AR Add form not displayed properly
            var rows = $("<table>"+data+"</table>").find("tr");
            $("[form_id='" + form_id + "'] tr[data-ajax_category='" + cat_title + "']")
                .replaceWith(rows);
            $(element).removeClass("collapsed").addClass("expanded");
            def.resolve();
          });
    }
    else {
      // When ajax_categories are disabled, all cat items exist as TR elements:
      $(element).parent().nextAll("tr[cat='" + $(element).attr("cat") + "']").toggle(true);
      $(element).removeClass("collapsed").addClass("expanded");
      def.resolve();
    }
    // Set expanded class on TR
    return def.promise();
  }

  function click_uid_checkbox(){
    /*jshint validthis:true */
    calcdependencies([this]);
    var service_uid = $(this).val();
    if ($(this).prop("checked")){
      check_service(service_uid);
    } else {
      uncheck_service(service_uid);
    }
    $("#AnalysisProfile").val("");
  }

  $(document).ready(function(){
    $("[name='uids:list']").live("click", click_uid_checkbox);
    $("#AnalysisProfile").bind("selected", setAnalysisProfile);
  });
}(jQuery));
